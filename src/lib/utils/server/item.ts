import prisma from "@/lib/prisma";
import { LoanItemStatus } from "@/lib/types/loans";

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
        },
      },
    },
  });

  // Calculate pending and on-loan counts
  const pendingCounts = await prisma.loanItemDetail.groupBy({
    by: ['itemId'],
    where: { loanStatus: LoanItemStatus.PENDING },
    _sum: { loanQty: true }
  });

  const onLoanCounts = await prisma.loanItemDetail.groupBy({
    by: ['itemId'],
    where: { loanStatus: LoanItemStatus.ON_LOAN },
    _sum: { loanQty: true }
  });

  const pendingMap = new Map(pendingCounts.map(p => [p.itemId, p._sum.loanQty || 0]));
  const onLoanMap = new Map(onLoanCounts.map(p => [p.itemId, p._sum.loanQty || 0]));

  // Enrich items with pending/onLoan counts
  return items.map(item => {
    const onLoan = onLoanMap.get(item.itemId) || 0;
    const pending = pendingMap.get(item.itemId) || 0;

    const totalQty = item.itemQty + onLoan;
    const netQty = Math.max(0, item.itemQty - pending);

    return {
      ...item,
      totalQty,
      netQty
    };
  });
};
