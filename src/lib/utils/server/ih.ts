import prisma from "@/lib/prisma";

export const getIHs = async () =>
    prisma.iH.findMany({
      select: {
        ihId: true,
        ihName: true,
        ihType: true,
        members: {
          where: { isPrimary: true },
          select: {
            user: {
              select: {
                telegramHandle: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 1,
        },
      },
    });
