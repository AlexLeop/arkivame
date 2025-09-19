
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  // Create super admin user (test account)
  const superAdminPassword = await bcrypt.hash('johndoe123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  
  console.log('✅ Super admin created');
  
  // Create sample organizations
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corp',
      slug: 'demo-corp',
      subdomain: 'demo',
      plan: 'BUSINESS',
      status: 'ACTIVE',
      planLimits: {
        maxUsers: -1, // unlimited
        maxKnowledgeItems: -1,
        maxTags: -1,
        advancedFeatures: true,
      },
      settings: {
        allowPublicKnowledge: false,
        autoTagging: true,
        aiSummaries: true,
      },
    },
  });
  
  const startupOrg = await prisma.organization.upsert({
    where: { slug: 'startup-inc' },
    update: {},
    create: {
      name: 'Startup Inc',
      slug: 'startup-inc',
      subdomain: 'startup',
      plan: 'STARTER',
      status: 'ACTIVE',
      planLimits: {
        maxUsers: 25,
        maxKnowledgeItems: 200,
        maxTags: 50,
        advancedFeatures: false,
      },
      settings: {
        allowPublicKnowledge: true,
        autoTagging: false,
        aiSummaries: false,
      },
    },
  });
  
  console.log('✅ Organizations created');
  
  // Create regular users
  const regularPassword = await bcrypt.hash('password123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@democorp.com' },
    update: {},
    create: {
      email: 'demo@democorp.com',
      firstName: 'Demo',
      lastName: 'User',
      name: 'Demo User',
      password: regularPassword,
      role: 'USER',
      isActive: true,
    },
  });
  
  const startupUser = await prisma.user.upsert({
    where: { email: 'founder@startup.com' },
    update: {},
    create: {
      email: 'founder@startup.com',
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
      password: regularPassword,
      role: 'USER',
      isActive: true,
    },
  });
  
  console.log('✅ Users created');
  
  // Link users to organizations
  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: demoOrg.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: demoUser.id,
      role: 'OWNER',
      isActive: true,
    },
  });
  
  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: startupOrg.id,
        userId: startupUser.id,
      },
    },
    update: {},
    create: {
      organizationId: startupOrg.id,
      userId: startupUser.id,
      role: 'OWNER',
      isActive: true,
    },
  });
  
  // Super admin access to all orgs
  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: demoOrg.id,
        userId: superAdmin.id,
      },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: superAdmin.id,
      role: 'ADMIN',
      isActive: true,
    },
  });
  
  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: startupOrg.id,
        userId: superAdmin.id,
      },
    },
    update: {},
    create: {
      organizationId: startupOrg.id,
      userId: superAdmin.id,
      role: 'ADMIN',
      isActive: true,
    },
  });
  
  console.log('✅ Organization memberships created');
  
  // Create hierarchical tags for Demo Corp
  const productTag = await prisma.tag.create({
    data: {
      organizationId: demoOrg.id,
      name: 'Product',
      slug: 'product',
      description: 'Product-related discussions',
      color: '#0A2540',
      level: 0,
      path: 'product',
    },
  });
  
  const featureTag = await prisma.tag.create({
    data: {
      organizationId: demoOrg.id,
      name: 'Features',
      slug: 'features',
      description: 'New features and enhancements',
      color: '#2ED9C3',
      parentId: productTag.id,
      level: 1,
      path: 'product/features',
    },
  });
  
  await prisma.tag.create({
    data: {
      organizationId: demoOrg.id,
      name: 'Bug Fixes',
      slug: 'bug-fixes',
      description: 'Bug reports and fixes',
      color: '#FF6B35',
      parentId: productTag.id,
      level: 1,
      path: 'product/bug-fixes',
    },
  });
  
  const engineeringTag = await prisma.tag.create({
    data: {
      organizationId: demoOrg.id,
      name: 'Engineering',
      slug: 'engineering',
      description: 'Engineering discussions',
      color: '#707070',
      level: 0,
      path: 'engineering',
    },
  });
  
  await prisma.tag.create({
    data: {
      organizationId: demoOrg.id,
      name: 'Architecture',
      slug: 'architecture',
      description: 'System architecture discussions',
      color: '#0A2540',
      parentId: engineeringTag.id,
      level: 1,
      path: 'engineering/architecture',
    },
  });
  
  // Create tags for Startup Inc
  await prisma.tag.create({
    data: {
      organizationId: startupOrg.id,
      name: 'General',
      slug: 'general',
      description: 'General discussions',
      color: '#2ED9C3',
      level: 0,
      path: 'general',
    },
  });
  
  await prisma.tag.create({
    data: {
      organizationId: startupOrg.id,
      name: 'Marketing',
      slug: 'marketing',
      description: 'Marketing strategies and campaigns',
      color: '#FF6B35',
      level: 0,
      path: 'marketing',
    },
  });
  
  console.log('✅ Tags created');
  
  // Create sample knowledge items
  const sampleKnowledge1 = await prisma.knowledgeItem.create({
    data: {
      organizationId: demoOrg.id,
      title: 'New Authentication System Implementation',
      content: {
        messages: [
          {
            author: 'Demo User',
            text: 'We need to implement a new authentication system with JWT tokens.',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            attachments: [],
          },
          {
            author: 'John Doe',
            text: 'I suggest we use NextAuth.js for this. It has great documentation and supports multiple providers.',
            timestamp: new Date(Date.now() - 86300000).toISOString(),
            attachments: [],
          },
          {
            author: 'Demo User',
            text: 'Agreed. Let\'s also implement proper role-based access control.',
            timestamp: new Date(Date.now() - 86200000).toISOString(),
            attachments: [],
          },
        ],
        metadata: {
          channelName: 'engineering',
          platform: 'slack' as const,
        },
      },
      summary: 'Discussion about implementing a new authentication system using NextAuth.js with role-based access control.',
      sourceType: 'SLACK',
      createdById: demoUser.id,
      archivedById: demoUser.id,
      rootMessageAuthor: 'Demo User',
      channelName: 'engineering',
      status: 'PUBLISHED',
      originalTimestamp: new Date(Date.now() - 86400000),
      viewCount: 15,
      searchCount: 5,
    },
  });
  
  const sampleKnowledge2 = await prisma.knowledgeItem.create({
    data: {
      organizationId: demoOrg.id,
      title: 'UI Component Library Guidelines',
      content: {
        messages: [
          {
            author: 'Demo User',
            text: 'We should establish guidelines for our component library to ensure consistency.',
            timestamp: new Date(Date.now() - 72000000).toISOString(),
            attachments: [],
          },
          {
            author: 'John Doe',
            text: 'I propose we use a design system approach with tokens for colors, spacing, and typography.',
            timestamp: new Date(Date.now() - 71900000).toISOString(),
            attachments: [],
          },
        ],
        metadata: {
          channelName: 'design',
          platform: 'slack' as const,
        },
      },
      summary: 'Guidelines for component library consistency using design system approach.',
      sourceType: 'SLACK',
      createdById: demoUser.id,
      archivedById: demoUser.id,
      rootMessageAuthor: 'Demo User',
      channelName: 'design',
      status: 'PUBLISHED',
      originalTimestamp: new Date(Date.now() - 72000000),
      viewCount: 8,
      searchCount: 3,
    },
  });
  
  // Create sample knowledge for Startup Inc
  await prisma.knowledgeItem.create({
    data: {
      organizationId: startupOrg.id,
      title: 'Marketing Campaign Planning',
      content: {
        messages: [
          {
            author: 'Jane Smith',
            text: 'Let\'s plan our Q4 marketing campaign focusing on social media.',
            timestamp: new Date(Date.now() - 60000000).toISOString(),
            attachments: [],
          },
        ],
        metadata: {
          channelName: 'marketing',
          platform: 'teams' as const,
        },
      },
      summary: 'Q4 marketing campaign planning discussion.',
      sourceType: 'TEAMS',
      createdById: startupUser.id,
      archivedById: startupUser.id,
      rootMessageAuthor: 'Jane Smith',
      channelName: 'marketing',
      status: 'PUBLISHED',
      originalTimestamp: new Date(Date.now() - 60000000),
    },
  });
  
  console.log('✅ Knowledge items created');
  
  // Create tag assignments
  await prisma.tagAssignment.create({
    data: {
      knowledgeItemId: sampleKnowledge1.id,
      tagId: engineeringTag.id,
      assignedBy: demoUser.id,
      isAutoAssigned: false,
    },
  });
  
  await prisma.tagAssignment.create({
    data: {
      knowledgeItemId: sampleKnowledge2.id,
      tagId: productTag.id,
      assignedBy: demoUser.id,
      isAutoAssigned: false,
    },
  });
  
  await prisma.tagAssignment.create({
    data: {
      knowledgeItemId: sampleKnowledge2.id,
      tagId: featureTag.id,
      assignedBy: demoUser.id,
      isAutoAssigned: true,
      confidence: 0.85,
    },
  });
  
  console.log('✅ Tag assignments created');
  
  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: demoOrg.id,
        userId: demoUser.id,
        action: 'knowledge.create',
        entity: 'KnowledgeItem',
        entityId: sampleKnowledge1.id,
        details: { title: 'New Authentication System Implementation' },
        level: 'INFO',
        source: 'web',
      },
      {
        organizationId: demoOrg.id,
        userId: demoUser.id,
        action: 'tag.assign',
        entity: 'TagAssignment',
        entityId: engineeringTag.id,
        details: { knowledgeItemId: sampleKnowledge1.id, tagName: 'Engineering' },
        level: 'INFO',
        source: 'web',
      },
      {
        organizationId: null, // System-wide log
        userId: superAdmin.id,
        action: 'organization.create',
        entity: 'Organization',
        entityId: demoOrg.id,
        details: { name: 'Demo Corp', plan: 'BUSINESS' },
        level: 'INFO',
        source: 'admin',
      },
    ],
  });
  
  console.log('✅ Audit logs created');
  
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('🔑 Test Accounts:');
  console.log('Super Admin: john@doe.com / johndoe123');
  console.log('Demo Corp User: demo@democorp.com / password123');
  console.log('Startup Inc User: founder@startup.com / password123');
  console.log('');
  console.log('🏢 Organizations:');
  console.log('Demo Corp: demo.yourdomain.com (Business Plan)');
  console.log('Startup Inc: startup.yourdomain.com (Starter Plan)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
