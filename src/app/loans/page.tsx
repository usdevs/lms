import React from "react";
import prisma from "@/lib/prisma";
import { getLoans } from "@/lib/actions/loan";
import { LoansTable } from "@/components/loans/LoansTable";
import { NewLoanModal } from "@/components/loans/NewLoanModal";
import { DashboardNav } from "@/components/DashboardNav";

// Since this is a server component, we can fetch data directly
export default async function LoanDashboardPage() {

  // 1. Fetch Loans
  const loans = await getLoans();

  // 2. Fetch Requesters for the selector
  const requesters = await prisma.requester.findMany({
    select: { reqId: true, reqName: true, reqNusnet: true },
    orderBy: { reqName: 'asc' }
  });

  // 3. Fetch Items
  const items = await prisma.item.findMany({
    select: { itemId: true, itemDesc: true, nuscSn: true, itemQty: true },
    orderBy: { itemDesc: 'asc' }
  });

  // 4. Calculate Stats (Pending & On Loan)
  // We need to know how many are currently ON_LOAN (to calculate Total Asset count)
  // and how many are PENDING (to calculate Net Available for new requests)

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

  return (
    <div className="min-h-screen w-full bg-[#0C2C47] p-8">
      <DashboardNav />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Loans</h1>
          <p className="text-white/80">{loans.length} LOAN REQUESTS</p>
        </div>

        <NewLoanModal
          requesters={requesters}
          items={enrichedItems}
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <LoansTable data={loans} />
      </div>
    </div>
  );
}