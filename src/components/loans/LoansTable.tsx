import React from "react";
import { Badge } from "@/components/ui/badge";

type LoanShape = {
  id: number;
  name: string;
  status: string;
  date: string;
};

export function LoansTable({ data }: { data: LoanShape[] }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-4 font-medium text-gray-700">Ref No</th>
            <th className="p-4 font-medium text-gray-700">Date</th>
            <th className="p-4 font-medium text-gray-700">Requester</th>
            <th className="p-4 font-medium text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((loan) => (
            <tr key={loan.id} className="border-b hover:bg-gray-50 transition-colors">
              <td className="p-4">#{loan.id}</td>
              <td className="p-4 text-gray-600">{loan.date}</td>
              <td className="p-4 font-medium">{loan.name}</td>
              <td className="p-4">
                <Badge variant={loan.status === "Active" ? "default" : "secondary"}>
                  {loan.status}
                </Badge>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-500">
                No loans found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

