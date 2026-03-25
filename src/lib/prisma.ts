import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth/session';

// add prisma to the NodeJS global type
interface GlobalPrisma {
  prisma: PrismaClient;
}

// prevent multiple instances of Prisma Client in development
declare const global: GlobalPrisma & typeof globalThis;

let prismaBase: PrismaClient;

// check to use this workaround only in development and not in production
if (process.env.NODE_ENV === 'production') {
  prismaBase= new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prismaBase = global.prisma;
}

// Support soft delete
const SOFT_DELETE = new Set([
 'User',
 'IHMember',
 'IH',
 'Item',
 'LoanItemDetail',
 'LoanRequest',
 'Sloc'
]);

// Get id of record 
const MODEL_ID_MAP: Record<string, string> = {
  User: 'userId',
  IHMember: 'id',
  IH: 'ihId',
  Item: 'itemId',
  LoanItemDetail: 'loanDetailId',
  LoanRequest: 'refNo',
  Sloc: 'slocId'
};

// Access to model client by name
const MODEL_CLIENT_MAP: Record<string, any> = {
  User: prismaBase.user,
  IHMember: prismaBase.iHMember,
  IH: prismaBase.iH,
  Item: prismaBase.item,
  LoanItemDetail: prismaBase.loanItemDetail,
  LoanRequest: prismaBase.loanRequest,
  Sloc: prismaBase.sloc,
};

// Audit 
async function audit(
  action: string,
  model: string,
  recordId: number | null,
  userId?: number | null,
) {
  try {
    await prismaBase.auditLog.create({
      data: {
        action: action.toUpperCase(),
        model,
        recordId,
        userId: userId ?? null,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export function createPrisma() {
  return prismaBase.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }: any) {
          const result = await query(args);
          const id = MODEL_ID_MAP[model];
          const session = await getSession();
          const userId = session?.user.userId ?? null;

          await audit('create', model, result?.[id] ?? null, userId);
          return result;
        },

        async update({ model, args, query }: any) {
          const result = await query(args);
          const id = MODEL_ID_MAP[model];
          const session = await getSession();
          const userId = session?.user.userId ?? null;

          await audit('update', model, result?.[id] ?? null, userId);
          return result;
        },

        async delete({ model, args, query }: any) {
          const id = MODEL_ID_MAP[model];
          const recordId = args?.where?.[id] ?? null;
          const table = MODEL_CLIENT_MAP[model];
          const session = await getSession();
          const userId = session?.user.userId ?? null;
          
          if (!SOFT_DELETE.has(model)) {
           const result = await table.delete(args);
           await audit('delete', model, recordId, userId);
           return result;
          }

          const result = await table.update({
            where: args.where,
            data: { deletedAt: new Date() },
          });
          await audit('delete', model, recordId, userId);
          return result;
        },

        async createMany({ model, args, query }: any) {
          const result = await query(args);
          const session = await getSession();
          const userId = session?.user.userId ?? null;

          await audit('createMany', model, null, userId);
          return result;
        },

        async updateMany({ model, args, query }: any) {
          const result = await query(args);
          const session = await getSession();
          const userId = session?.user.userId ?? null;

          await audit('updateMany', model, null, userId);
          return result;
        },

        async deleteMany({ model, args, query }: any) {
          const table = MODEL_CLIENT_MAP[model];
          const session = await getSession();
          const userId = session?.user.userId ?? null;
          
          if (!SOFT_DELETE.has(model)) {
           const result = await table.deleteMany(args);
           await audit('deleteMany', model, null, userId);
           return result;
          }

          const result = await table.updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
          await audit('deleteMany', model, null, userId);
          return result;
        },

        // For soft delete
        async findMany({ model, args, query }: any) { 
          if (!SOFT_DELETE.has(model)) {
            return query(args);
          }

          return query({
            ...args,
            where: {
              ...args.where,
              deletedAt: null,
            },
          });
        },

        async findFirst({ model, args, query }: any) {
          if (!SOFT_DELETE.has(model)) {
            return query(args);
          }

          return query({
            ...args,
            where: {
              ...args.where,
              deletedAt: null,
            },
          });
        },
      },  
    }
  })};

  const prisma = createPrisma();
  export default prisma; 