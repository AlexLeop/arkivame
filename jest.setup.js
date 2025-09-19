// Mock do Prisma para todos os testes
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: jest.fn(),
}));