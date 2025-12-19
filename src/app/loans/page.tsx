"use client";

import React, { useState } from "react";
import {LoansTable} from "@/components/loans/LoansTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoanDashboardPage() {
  const allLoans = [
    { id: 101, name: "John Doe", status: "Active", date: "2024-01-15" },
    { id: 102, name: "Jane Smith", status: "Returned", date: "2024-01-10" },
    { id: 103, name: "Sam Wilson", status: "Active", date: "2024-01-20" },
    { id: 104, name: "Alice Brown", status: "Returned", date: "2023-12-25" },
    { id: 105, name: "Charlie Davis", status: "Active", date: "2024-02-01" },
  ];

  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredLoans = allLoans.filter((loan) => {
    const statusMatches = statusFilter === "All" || loan.status === statusFilter;
    const loanDate = new Date(loan.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const isAfterStart = start ? loanDate >= start : true;
    const isBeforeEnd = end ? loanDate <= end : true;
    return statusMatches && isAfterStart && isBeforeEnd;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Loan Dashboard</h1>
        <Button>+ New Request</Button>
      </div>

      <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active Only</SelectItem>
              <SelectItem value="Returned">Returned Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none">Start Date</label>
          <Input
            type="date"
            className="w-[160px]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none">End Date</label>
          <Input
            type="date"
            className="w-[160px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setStatusFilter("All");
            setStartDate("");
            setEndDate("");
          }}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Reset Filters
        </Button>
      </div>

      <LoansTable data={filteredLoans} />
    </div>
  );
}