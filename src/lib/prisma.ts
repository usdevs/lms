import { PrismaClient } from '@prisma/client';

// add prisma to the NodeJS global type
interface GlobalPrisma {
  prisma: PrismaClient;
}

// prevent multiple instances of Prisma Client in development
declare const global: GlobalPrisma & typeof globalThis;

let prisma: PrismaClient;

// check to use this workaround only in development and not in production
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;

