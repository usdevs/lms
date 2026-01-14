import prisma from "@/lib/prisma";

export const getSlocs = async () =>
    prisma.sloc.findMany({
      select: {
        slocId: true,
        slocName: true,
      },
    });
