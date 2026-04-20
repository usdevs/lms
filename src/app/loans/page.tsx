import React from "react";
import { redirect } from "next/navigation";
import { getLoans } from "@/lib/utils/server/loans";
import { getUsers } from "@/lib/utils/server/users";
import { getItems } from "@/lib/utils/server/item";
import { DashboardNav } from "@/components/DashboardNav";
import { getSession } from "@/lib/auth/session";
import { canViewLoans } from "@/lib/auth/rbac";
import { LoansPageContent } from "@/components/loans/LoansPageContent";

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
      <LoansPageContent
        loans={loans}
        requesters={requesters}
        items={items}
        loanCount={loans.length}
      />
    </div>
  );
}
