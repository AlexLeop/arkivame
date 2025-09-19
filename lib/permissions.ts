import { prisma } from './db';

export class NotAuthorizedError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'NotAuthorizedError';
  }
}

export async function validateUserOrgAccess(userId: string, orgId: string): Promise<void> {
  const organizationUser = await prisma.organizationUser.findFirst({
    where: {
      userId,
      organizationId: orgId,
    },
  });

  if (!organizationUser) {
    throw new NotAuthorizedError('User is not a member of this organization.');
  }
}