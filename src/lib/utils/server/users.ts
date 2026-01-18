import prisma from "@/lib/prisma";

/**
 * Get all users
 */
export const getUsers = async () =>
    prisma.user.findMany({
    select: { userId: true, firstName: true, lastName: true, nusnetId: true, telegramHandle: true },
    orderBy: { firstName: 'asc' }
  });
