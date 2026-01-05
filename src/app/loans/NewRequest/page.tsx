"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddLoanForm from "@/components/loans/AddNewLoan/AddLoanForm"; 
export default function NewRequestPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link 
        href="/loans" 
        className="flex items-center text-sm text-gray-500 hover:text-black mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-8">Loan Request Form</h1>

      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <AddLoanForm />
      </div>
    </div>
  );
}