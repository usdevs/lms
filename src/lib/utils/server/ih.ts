import prisma from "@/lib/prisma";

export const getIHs = async () =>
    prisma.iH.findMany({
      select: {
        ihId: true,
        ihName: true,
      },
    });
