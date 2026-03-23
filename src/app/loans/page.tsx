import React from "react";
import { redirect } from "next/navigation";
import { getLoans } from "@/lib/utils/server/loans";
import { LoansTable } from "@/components/loans/LoansTable";
import { LoanFormModal } from "@/components/loans/LoanFormModal";
import { getUsers } from "@/lib/utils/server/users";
import { getItems } from "@/lib/utils/server/item";
import { DashboardNav } from "@/components/DashboardNav";
import { getSession } from "@/lib/auth/session";
import { canViewLoans } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function LoanDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // Only LOGS and ADMIN can view loans
  if (!canViewLoans(session.user.role)) {
    redirect("/catalogue");
  }

  const loans = await getLoans();
  const requesters = await getUsers();
  const items = await getItems();

  return (
    <div className="min-h-screen w-full bg-[#0C2C47] p-4 md:p-8">
      <DashboardNav userRole={session.user.role} />
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Loans</h1>
          <p className="text-white/80">{loans.length} LOAN REQUESTS</p>
        </div>

        <LoanFormModal
          requesters={requesters}
          items={items}
          mode="add"
        />
      </div>

      <div className="bg-white rounded-lg p-3 md:p-6 shadow-sm">
        <LoansTable data={loans} items={items} />
      </div>
    </div>
  );
}
