import prisma from "@/lib/prisma";
import { LoanItemStatus } from "@prisma/client";

export const getItems = async () => {
  const items = await prisma.item.findMany({
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
      },
    },
  });

  // Calculate on-loan counts
  const onLoanCounts = await prisma.loanItemDetail.groupBy({
    by: ['itemId'],
    where: { loanItemStatus: LoanItemStatus.ON_LOAN },
    _sum: { loanQty: true }
  });

  const onLoanMap = new Map(onLoanCounts.map(p => [p.itemId, p._sum.loanQty || 0]));

  // Enrich items with availableQty and totalQty
  // Normal items: itemQty is constant (total assets), availableQty = itemQty - onLoan
  // Expendable items: itemQty decreases on approval (consumed), availableQty = itemQty (remaining stock)
  return items.map(item => {
    const onLoan = onLoanMap.get(item.itemId) || 0;

    if (item.itemExpendable) {
      // Expendable: itemQty is what's left, onLoan shows what's "out" but will be consumed
      return {
        ...item,
        totalQty: item.itemQty + onLoan,
        availableQty: item.itemQty,
      };
    } else {
      // Normal: itemQty is constant total, onLoan tracks what's out
      return {
        ...item,
        totalQty: item.itemQty,
        availableQty: item.itemQty - onLoan,
      };
    }
  });
};
