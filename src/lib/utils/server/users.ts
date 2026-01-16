import prisma from "@/lib/prisma";

export const getRequesters = async () =>
    prisma.user.findMany({
    where: { role: 'REQUESTER' },
    select: { userId: true, firstName: true, lastName: true, nusnetId: true },
    orderBy: { firstName: 'asc' }
  });
