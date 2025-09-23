const { PrismaClient } = require('@prisma/client');

try {
  const prisma = new PrismaClient();
  console.log('PrismaClient initialized successfully in Node.js environment.');
  prisma.$disconnect();
} catch (e) {
  console.error('Error initializing PrismaClient:', e);
}

