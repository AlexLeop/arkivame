
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('Creating super admin user...');
  
  const email = 'admin@arkivame.com';
  const password = 'admin123';
  
  try {
    // Check if super admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log('Super admin already exists:', email);
      return existingUser;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create super admin
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    
    console.log('Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Access URL: http://localhost:3000/super-admin');
    
    return superAdmin;
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create super admin:', error);
    process.exit(1);
  });
