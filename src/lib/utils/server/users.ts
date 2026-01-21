import prisma from "@/lib/prisma";

/**
 * Get all users (basic info for selectors)
 */
export const getUsers = async () =>
    prisma.user.findMany({
    select: { userId: true, firstName: true, lastName: true, nusnetId: true, telegramHandle: true },
    orderBy: { firstName: 'asc' }
  });

/**
 * Get all users with full details for user management
 * Includes role, group memberships, loan counts, and item counts for IHs
 */
export const getUsersWithDetails = async () =>
    prisma.user.findMany({
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        nusnetId: true,
        telegramHandle: true,
        role: true,
        createdAt: true,
        ihMemberships: {
          select: {
            ihId: true,
            isPrimary: true,
            ih: {
              select: {
                ihId: true,
                ihName: true,
                ihType: true,
                _count: {
                  select: { items: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            loanRequests: true,
            handledLoans: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });
