import Catalogue from "@/components/catalogue/Catalogue";
import { getItems, getSlocs, getIHs } from "@/lib/utils/server/item";
import prisma from "@/lib/prisma";

export default async function CataloguePage() {
  const [items, slocs, ihs] = await Promise.all([
    getItems(),
    getSlocs(),
    getIHs(),
  ]);

  // Calculate Stats (Pending & On Loan)
  const pendingCounts = await prisma.loanItemDetail.groupBy({
    by: ['itemId'],
    where: { loanStatus: 'PENDING' },
    _sum: { loanQty: true }
  });

  const onLoanCounts = await prisma.loanItemDetail.groupBy({
    by: ['itemId'],
    where: { loanStatus: 'ON_LOAN' },
    _sum: { loanQty: true }
  });

  // Helper map
  const pendingMap = new Map(pendingCounts.map(p => [p.itemId, p._sum.loanQty || 0]));
  const onLoanMap = new Map(onLoanCounts.map(p => [p.itemId, p._sum.loanQty || 0]));

  const enrichedItems = items.map(item => {
    const onLoan = onLoanMap.get(item.itemId) || 0;
    const pending = pendingMap.get(item.itemId) || 0;

    // Total = Currently on shelf (itemQty) + Currently out (onLoan)
    const totalQty = item.itemQty + onLoan;

    // Net Available = Currently on shelf (itemQty) - Reserved in Pending (pending)
    const netQty = Math.max(0, item.itemQty - pending);

    return {
      ...item,
      totalQty,
      netQty
    };
  });

  return <Catalogue items={enrichedItems} slocs={slocs} ihs={ihs} />;
}

