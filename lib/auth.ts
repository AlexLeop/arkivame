
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // Email/Password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organizations: {
              include: { organization: true }
            }
          }
        });

        if (!user || !user.isActive) {
          throw new Error('User not found or inactive');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`.trim(),
          role: user.role,
          organizations: user.organizations.map(org => ({
            id: org.organization.id,
            name: org.organization.name,
            slug: org.organization.slug,
            role: org.role,
            plan: org.organization.plan
          }))
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const finalBaseUrl =
        process.env.NODE_ENV === 'development' && baseUrl.startsWith('https')
          ? baseUrl.replace('https', 'http')
          : baseUrl;

      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${finalBaseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      if (new URL(url).origin === finalBaseUrl) {
        return url;
      }

      return finalBaseUrl;
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, create or update user
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) return false;

        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!existingUser) {
            // Create new user from OAuth
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                password: '', // OAuth users don't have passwords
                role: 'USER',
                isActive: true,
              }
            });
          } else {
            // Update last login
            const dataToUpdate: { lastLoginAt: Date; name?: string; firstName?: string; lastName?: string } = {
              lastLoginAt: new Date(),
            };

            if (!existingUser.name && user.name) {
              dataToUpdate.name = user.name;
              dataToUpdate.firstName = user.name.split(' ')[0];
              dataToUpdate.lastName = user.name.split(' ').slice(1).join(' ');
            }

            await prisma.user.update({
              where: { id: existingUser.id },
              data: dataToUpdate,
            });
          }
        } catch (error) {
          console.error('Error handling OAuth sign in:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizations = user.organizations;
      }

      // Refresh user data from database occasionally
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const tokenIssueTime: number = typeof token.iat === 'number' ? token.iat : 0;
      const tokenAgeInSeconds = nowInSeconds - tokenIssueTime;
      const oneHourInSeconds = 60 * 60;

      if (token.id && tokenAgeInSeconds > oneHourInSeconds) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              organizations: {
                include: { organization: true }
              }
            }
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.organizations = dbUser.organizations.map(org => ({
              id: org.organization.id,
              name: org.organization.name,
              slug: org.organization.slug,
              role: org.role,
              plan: org.organization.plan
            }));
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.organizations = token.organizations;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`);
    },
    async signOut({ session }) {
      console.log(`User ${session?.user?.email} signed out`);
    }
  }
};
