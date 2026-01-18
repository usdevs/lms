"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Eye, CheckCircle, AlertCircle, Clock, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { returnItem, approveLoan, rejectLoan } from "@/lib/actions/loan";
import { LoanWithDetails } from "@/lib/types/loans";
import { LoanItemStatus, LoanRequestStatus } from "@prisma/client";

type FilterStatus = "ALL" | LoanRequestStatus;

interface LoansTableProps {
  data: LoanWithDetails[];
}

export function LoansTable({ data }: LoansTableProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const handleReturnItem = (detailId: number) => {
    startTransition(async () => {
      const result = await returnItem(detailId);
      if (result.success) {
        toast.success("Item marked as returned");
        if (selectedLoan) {
          setSelectedLoan({
            ...selectedLoan,
            loanDetails: selectedLoan.loanDetails.map(d =>
              d.loanDetailId === detailId ? { ...d, loanItemStatus: LoanItemStatus.RETURNED } : d
            )
          });
        }
      } else {
        toast.error("Failed: " + result.error);
      }
    });
  };

  const handleApprove = (refNo: number) => {
    startTransition(async () => {
      const result = await approveLoan(refNo);
      if (result.success) {
        toast.success("Loan approved and stock deducted");
        setSelectedLoan(prev => prev ? { ...prev, loanRequestStatus: LoanRequestStatus.ONGOING } : null);
      } else {
        toast.error("Approval failed: " + result.error);
      }
    });
  };

  const handleReject = (refNo: number) => {
    if (!confirm("Are you sure you want to reject this loan?")) return;
    startTransition(async () => {
      const result = await rejectLoan(refNo);
      if (result.success) {
        toast.success("Loan rejected");
        setSelectedLoan(prev => prev ? { ...prev, loanRequestStatus: LoanRequestStatus.REJECTED } : null);
      } else {
        toast.error("Rejection failed: " + result.error);
      }
    });
  };

  const filteredData = data.filter(loan => {
    const requesterName = `${loan.requester.firstName}${loan.requester.lastName ? ` ${loan.requester.lastName}` : ''}`;
    const matchesSearch =
      requesterName.toLowerCase().includes(search.toLowerCase()) ||
      (loan.requester.nusnetId && loan.requester.nusnetId.toLowerCase().includes(search.toLowerCase())) ||
      loan.refNo.toString().includes(search);

    if (filterStatus === "ALL") return matchesSearch;
    return matchesSearch && loan.loanRequestStatus === filterStatus;
  });

  const statusOptions: FilterStatus[] = ["ALL", LoanRequestStatus.PENDING, LoanRequestStatus.ONGOING, LoanRequestStatus.COMPLETED, LoanRequestStatus.REJECTED];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {statusOptions.map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            className="pl-8 w-[250px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref No</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No loans found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((loan) => (
                <TableRow key={loan.refNo}>
                  <TableCell className="font-medium">#{loan.refNo}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{loan.requester.firstName}{loan.requester.lastName ? ` ${loan.requester.lastName}` : ''}</span>
                      {loan.requester.nusnetId && (
                        <span className="text-xs text-muted-foreground">{loan.requester.nusnetId}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{loan.organisation || "-"}</TableCell>
                  <TableCell>{format(new Date(loan.loanDateStart), "dd MMM yyyy")}</TableCell>
                  <TableCell>{format(new Date(loan.loanDateEnd), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <StatusBadge status={loan.loanRequestStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedLoan(loan)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <DialogTitle>Loan Details #{selectedLoan?.refNo}</DialogTitle>
              {selectedLoan && <StatusBadge status={selectedLoan.loanRequestStatus} />}
            </div>
            <DialogDescription>
              Manage items for this loan request.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-md">
              <div>
                <span className="font-semibold block text-muted-foreground">Requester</span>
                <div className="text-lg">{selectedLoan?.requester.firstName}{selectedLoan?.requester.lastName ? ` ${selectedLoan.requester.lastName}` : ''}</div>
                {selectedLoan?.requester.nusnetId && (
                  <div className="text-sm text-muted-foreground">{selectedLoan.requester.nusnetId}</div>
                )}
              </div>
              <div>
                <span className="font-semibold block text-muted-foreground">Period</span>
                <div className="text-lg">
                  {selectedLoan && format(new Date(selectedLoan.loanDateStart), "dd MMM")} - {selectedLoan && format(new Date(selectedLoan.loanDateEnd), "dd MMM yyyy")}
                </div>
                {/* Lateness Check */}
                {selectedLoan && selectedLoan.loanRequestStatus === LoanRequestStatus.ONGOING && new Date() > new Date(selectedLoan.loanDateEnd) && (
                  <div className="text-destructive font-bold text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Overdue
                  </div>
                )}
              </div>
            </div>

            {/* Approval Actions */}
            {selectedLoan?.loanRequestStatus === LoanRequestStatus.PENDING && (
              <div className="flex gap-2 p-4 bg-blue-50/50 border border-blue-100 rounded-md items-center justify-between">
                <div className="text-sm text-blue-800">
                  This request is <strong>Pending Approval</strong>. Approving will deduct stock.
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleReject(selectedLoan.refNo)} disabled={isPending}>Reject</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => handleApprove(selectedLoan.refNo)} disabled={isPending}>Approve Loan</Button>
                </div>
              </div>
            )}

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLoan?.loanDetails.map((detail) => (
                    <TableRow key={detail.loanDetailId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{detail.item.itemDesc}</span>
                          <span className="text-xs text-muted-foreground">Item Id: {detail.itemId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{detail.loanQty}</TableCell>
                      <TableCell className="text-right">
                        {selectedLoan.loanRequestStatus === LoanRequestStatus.ONGOING && detail.loanItemStatus === LoanItemStatus.ON_LOAN && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnItem(detail.loanDetailId)}
                            disabled={isPending}
                          >
                            Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: LoanRequestStatus }) {
  switch (status) {
    case LoanRequestStatus.PENDING:
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    case LoanRequestStatus.ONGOING:
      return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700"><AlertCircle className="w-3 h-3 mr-1" /> Ongoing</Badge>;
    case LoanRequestStatus.COMPLETED:
      return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
    case LoanRequestStatus.REJECTED:
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

