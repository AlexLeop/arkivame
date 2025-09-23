import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { hasAdminPermission } from '@/lib/permissions';
import { invitationRateLimiter } from '@/lib/rate-limit';
import { checkAndNotifyLimits } from '@/lib/limit-notifications';
import crypto from 'crypto';

const inviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const getInvitesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { searchParams } = new URL(request.url);

    const query = getInvitesSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!query.success) {
      return NextResponse.json({ error: 'Invalid query parameters', issues: query.error.issues }, { status: 400 });
    }

    const { page, limit } = query.data;
    const skip = (page - 1) * limit;

    const [invitations, totalInvitations] = await prisma.$transaction([
      prisma.invitation.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invitation.count({ where: { organizationId } }),
    ]);

    const totalPages = Math.ceil(totalInvitations / limit);

    return NextResponse.json({
      data: invitations,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalInvitations,
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const session = await getServerSession(authOptions);
    const actorId = session!.user.id;

    if (!(await hasAdminPermission(organizationId, actorId))) {
      return NextResponse.json({ error: "You don't have permission to invite members." }, { status: 403 });
    }

    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = invitationRateLimiter.check(ip);
    
    if (!rateLimit.isAllowed) {
      return NextResponse.json(
        { 
          error: 'You have sent too many invitations. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000)
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString()
          }
        }
      );
    }

    const body = await request.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      throw new z.ZodError(validation.error.issues);
    }
    const { email, role } = validation.data;

    // Generate invitation token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await prisma.invitation.create({ data: { email, role, organizationId, token, expiresAt } });
    await logAudit(organizationId, actorId, 'MEMBER_INVITED', { invitedEmail: email, assignedRole: role });
    await checkAndNotifyLimits(organizationId, 'members');

    return NextResponse.json({ success: true, message: `Invitation sent to ${email}.` });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}