import 'dotenv/config';

import type { PrismaConfig } from 'prisma/config';

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
} satisfies PrismaConfig;
