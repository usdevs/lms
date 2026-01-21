import React from "react";
import { getLoans } from "@/lib/utils/server/loans";
import { LoansTable } from "@/components/loans/LoansTable";
import { LoanFormModal } from "@/components/loans/LoanFormModal";
import { DashboardNav } from "@/components/DashboardNav";
import { getUsers } from "@/lib/utils/server/users";
import { getItems } from "@/lib/utils/server/item";


export default async function LoanDashboardPage() {

  const loans = await getLoans();
  const requesters = await getUsers();
  const items = await getItems();

  return (
    <div className="min-h-screen w-full bg-[#0C2C47] p-8">
      <DashboardNav />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Loans</h1>
          <p className="text-white/80">{loans.length} LOAN REQUESTS</p>
        </div>

        <LoanFormModal
          requesters={requesters}
          items={items}
          mode="add"
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <LoansTable data={loans} items={items} />
      </div>
    </div>
  );
}
