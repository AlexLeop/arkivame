import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse('Name, email, and password are required', { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
    });

    // Create a default organization for the new user
    const organizationName = `${newUser.name || newUser.email}'s Organization`;
    const organizationSlug = generateSlug(organizationName);

    const newOrganization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
        plan: 'FREE',
        users: {
          create: {
            userId: newUser.id,
            role: 'OWNER',
          },
        },
      },
    });

    return NextResponse.json({
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      organization: { id: newOrganization.id, name: newOrganization.name },
    }, { status: 201 });
  } catch (error) {
    console.error('[SIGNUP_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
