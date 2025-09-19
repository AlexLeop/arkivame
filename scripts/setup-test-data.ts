
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // Create test organization if not exists
    const existingOrg = await prisma.organization.findFirst({
      where: { slug: 'test-org' }
    });
    
    if (!existingOrg) {
      // Create test user
      const testUser = await prisma.user.create({
        data: {
          email: 'test@arkivame.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
          isActive: true,
        },
      });
      
      // Create test organization
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          subdomain: 'test-org',
          plan: 'STARTER',
          status: 'ACTIVE',
          planLimits: {
            maxUsers: 25,
            maxKnowledgeItems: 200,
            maxTags: 50,
            advancedFeatures: false,
          },
          settings: {
            allowPublicKnowledge: false,
            autoTagging: false,
            aiSummaries: false,
            customBranding: false,
          },
        },
      });
      
      // Link user to organization
      await prisma.organizationUser.create({
        data: {
          organizationId: testOrg.id,
          userId: testUser.id,
          role: 'OWNER',
          isActive: true,
        },
      });
      
      console.log('Test data created successfully!');
      console.log('Test User Email: test@arkivame.com');
      console.log('Test User Password: password123');
      console.log('Test Organization: test-org');
    } else {
      console.log('Test data already exists.');
    }
    
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to setup test data:', error);
    process.exit(1);
  });
