import prisma from "@/lib/prisma";
import { IHType } from "@prisma/client";

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

/**
 * Get GROUP and DEPARTMENT IHs with all members (not just primary)
 * Used for user management - group assignment
 */
export const getGroupIHs = async () =>
    prisma.iH.findMany({
      where: {
        ihType: {
          in: [IHType.GROUP, IHType.DEPARTMENT],
        },
      },
      select: {
        ihId: true,
        ihName: true,
        ihType: true,
        members: {
          select: {
            userId: true,
            isPrimary: true,
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                telegramHandle: true,
                role: true,
              },
            },
          },
          orderBy: [
            { isPrimary: 'desc' },
            { user: { firstName: 'asc' } },
          ],
        },
      },
      orderBy: { ihName: 'asc' },
    });
