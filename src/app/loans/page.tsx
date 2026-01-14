import React from "react";
import prisma from "@/lib/prisma";
import { getLoans } from "@/lib/actions/loan";
import { LoansTable } from "@/components/loans/LoansTable";
import { NewLoanModal } from "@/components/loans/NewLoanModal";
import { DashboardNav } from "@/components/DashboardNav";


export default async function LoanDashboardPage() {


  const loans = await getLoans();


  const requesters = await prisma.requester.findMany({
    select: { reqId: true, reqName: true, reqNusnet: true },
    orderBy: { reqName: 'asc' }
  });


  const items = await prisma.item.findMany({
    select: { itemId: true, itemDesc: true, nuscSn: true, itemQty: true },
    orderBy: { itemDesc: 'asc' }
  });

  // Calculate inventory stats

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


  const pendingMap = new Map(pendingCounts.map(p => [p.itemId, p._sum.loanQty || 0]));
  const onLoanMap = new Map(onLoanCounts.map(p => [p.itemId, p._sum.loanQty || 0]));

  const enrichedItems = items.map(item => {
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