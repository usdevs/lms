import { PrismaClient, Prisma } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';
import { getSession } from '@/lib/auth/session';

interface GlobalPrisma {
  prisma: PrismaClient;
}

declare const global: GlobalPrisma & typeof globalThis;

let prismaBase: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaBase = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prismaBase = global.prisma;
}

const dmmfModels = Prisma.dmmf.datamodel.models;

const MODEL_ID_MAP = Object.fromEntries(
  dmmfModels.map((m: Prisma.DMMF.Model) => [
    m.name,
    m.fields.find((f: Prisma.DMMF.Field) => f.isId)?.name ?? 'id',
  ])
);

const softDeleteConfig = Object.fromEntries(
  dmmfModels
    .filter((m: Prisma.DMMF.Model) => m.fields.some((f: Prisma.DMMF.Field) => f.name === 'deletedAt'))
    .map((m: Prisma.DMMF.Model) => [m.name, { field: 'deletedAt', createValue: () => new Date() }])
);

async function getSessionUserId() {
  const session = await getSession();
  return session?.user.userId ?? null;
}

async function audit(action: string, model: string, recordId: number | null, userId: number | null) {
  try {
    await prismaBase.auditLog.create({
      data: { action: action.toUpperCase(), model, recordId, userId },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export function createPrisma() {
  return prismaBase
    .$extends(createSoftDeleteExtension({ models: softDeleteConfig }))
    .$extends({
      query: {
        $allModels: {
          async create({ model, args, query }: any) {
            const result = await query(args);
            await audit('create', model, result?.[MODEL_ID_MAP[model]] ?? null, await getSessionUserId());
            return result;
          },

          async update({ model, args, query }: any) {
            const result = await query(args);
            await audit('update', model, result?.[MODEL_ID_MAP[model]] ?? null, await getSessionUserId());
            return result;
          },

          async delete({ model, args, query }: any) {
            const recordId = args?.where?.[MODEL_ID_MAP[model]] ?? null;
            const result = await query(args);
            await audit('delete', model, recordId, await getSessionUserId());
            return result;
          },

          async createMany({ model, args, query }: any) {
            const result = await query(args);
            await audit('createMany', model, null, await getSessionUserId());
            return result;
          },

          async updateMany({ model, args, query }: any) {
            const result = await query(args);
            await audit('updateMany', model, null, await getSessionUserId());
            return result;
          },

          async deleteMany({ model, args, query }: any) {
            const result = await query(args);
            await audit('deleteMany', model, null, await getSessionUserId());
            return result;
          },
        },
      },
    });
}

const prisma = createPrisma();
export default prisma;
