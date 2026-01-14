import prisma from "@/lib/prisma";

export const getItems = async () =>
  prisma.item.findMany({
    include: {
      sloc: {
        select: {
          slocId: true,
          slocName: true,
        },
      },
      ih: {
        select: {
          ihId: true,
          ihName: true,
        },
      },
    },
  });
