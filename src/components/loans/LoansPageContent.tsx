"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoansTable } from "./LoansTable";
import { LoanFormModal } from "./LoanFormModal";
import { LoanWithDetails } from "@/lib/types/loans";
import { RequesterOption } from "./RequesterSelector";
import { ItemOption } from "./ItemSelector";

interface LoansPageContentProps {
    loans: LoanWithDetails[];
    requesters: RequesterOption[];
    items: ItemOption[];
    loanCount: number;
}

export function LoansPageContent({ loans, requesters, items, loanCount }: LoansPageContentProps) {
    const [autoOpenRefNo, setAutoOpenRefNo] = useState<number | null>(null);
    const router = useRouter();

    const handleLoanCreated = useCallback((refNo: number) => {
        setAutoOpenRefNo(refNo);
        router.refresh();
    }, [router]);

    const handleAutoOpened = useCallback(() => {
        setAutoOpenRefNo(null);
    }, []);

    return (
        <>
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Loans</h1>
                    <p className="text-white/80">{loanCount} LOAN REQUESTS</p>
                </div>
                <LoanFormModal
                    requesters={requesters}
                    items={items}
                    mode="add"
                    onCreated={handleLoanCreated}
                />
            </div>

            <div className="bg-white rounded-lg p-3 md:p-6 shadow-sm">
                <LoansTable
                    data={loans}
                    items={items}
                    autoOpenRefNo={autoOpenRefNo}
                    onAutoOpened={handleAutoOpened}
                />
            </div>
        </>
    );
}
