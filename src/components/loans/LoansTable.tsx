"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Eye, CheckCircle, AlertCircle, Clock, XCircle, Search, Trash2, Package, Calendar, Pencil } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { returnItem, approveLoan, rejectLoan, deleteLoan } from "@/lib/actions/loan";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoanFormModal } from "./LoanFormModal";
import { LoanWithDetails } from "@/lib/types/loans";
import { LoanItemStatus, LoanRequestStatus } from "@prisma/client";
import { ItemOption } from "./ItemSelector";

type FilterStatus = "ALL" | LoanRequestStatus;

interface LoansTableProps {
  data: LoanWithDetails[];
  items: ItemOption[];
  autoOpenRefNo?: number | null;
  onAutoOpened?: () => void;
}

export function LoansTable({ data, items, autoOpenRefNo, onAutoOpened }: LoansTableProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRefNo, setDeletingRefNo] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-open a loan detail dialog when requested (e.g. after creation)
  useEffect(() => {
    if (autoOpenRefNo != null) {
      const loan = data.find(l => l.refNo === autoOpenRefNo);
      if (loan) {
        setSelectedLoan(loan);
        onAutoOpened?.();
      }
    }
  }, [autoOpenRefNo, data, onAutoOpened]);

  // Helper to check if a loan item has insufficient stock for approval
  const getItemAvailability = (itemId: number, requestedQty: number) => {
    const itemInfo = items.find(i => i.itemId === itemId);
    if (!itemInfo) return { available: 0, sufficient: false };
    const available = itemInfo.availableQty ?? itemInfo.itemQty;
    return { available, sufficient: requestedQty <= available };
  };

  // Check if all items in a loan have sufficient stock
  const canApproveLoan = (loan: LoanWithDetails) => {
    return loan.loanDetails.every(detail => {
      const { sufficient } = getItemAvailability(detail.itemId, detail.loanQty);
      return sufficient;
    });
  };

  const handleReturnItem = (detailId: number) => {
    startTransition(async () => {
      const result = await returnItem(detailId);
      if (result.success) {
        toast.success("Item marked as returned");
        // Update local state with the actual status from server (RETURNED or RETURNED_LATE)
        if (selectedLoan) {
          const returnedStatus = result.status || LoanItemStatus.RETURNED;
          const updatedDetails = selectedLoan.loanDetails.map(d =>
            d.loanDetailId === detailId ? { ...d, loanItemStatus: returnedStatus } : d
          );

          // Check if all items are now returned/rejected
          const allReturned = updatedDetails.every(d =>
            d.loanItemStatus === LoanItemStatus.RETURNED ||
            d.loanItemStatus === LoanItemStatus.RETURNED_LATE ||
            d.loanItemStatus === LoanItemStatus.REJECTED
          );

          setSelectedLoan({
            ...selectedLoan,
            loanDetails: updatedDetails,
            // Update loan status if all items returned
            loanRequestStatus: allReturned ? LoanRequestStatus.COMPLETED : selectedLoan.loanRequestStatus
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
        // Update local state - keep popup open with new status
        setSelectedLoan(prev => prev ? {
          ...prev,
          loanRequestStatus: LoanRequestStatus.ONGOING,
          // Also update all item statuses to ON_LOAN
          loanDetails: prev.loanDetails.map(d => ({
            ...d,
            loanItemStatus: LoanItemStatus.ON_LOAN
          }))
        } : null);
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
        // Update local state - keep popup open with new status
        setSelectedLoan(prev => prev ? {
          ...prev,
          loanRequestStatus: LoanRequestStatus.REJECTED,
          // Also update all item statuses to REJECTED
          loanDetails: prev.loanDetails.map(d => ({
            ...d,
            loanItemStatus: LoanItemStatus.REJECTED
          }))
        } : null);
      } else {
        toast.error("Rejection failed: " + result.error);
      }
    });
  };

  const handleDelete = async (refNo: number) => {
    setIsDeleting(true);
    const result = await deleteLoan(refNo);
    setIsDeleting(false);

    if (result.success) {
      setDeleteDialogOpen(false);
      setDeletingRefNo(null);
      toast.success("Loan deleted successfully");
    } else {
      toast.error("Delete failed: " + result.error);
    }
  };

  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase();
    return data.filter(loan => {
      const requesterName = `${loan.requester.firstName}${loan.requester.lastName ? ` ${loan.requester.lastName}` : ''}`;

      // Search by requester name, NUSNET, ref no
      const matchesBasicSearch =
        requesterName.toLowerCase().includes(searchLower) ||
        (loan.requester.nusnetId && loan.requester.nusnetId.toLowerCase().includes(searchLower)) ||
        loan.refNo.toString().includes(search);

      // Search by item name or item ID
      const matchesItemSearch = loan.loanDetails.some(detail =>
        detail.item.itemDesc.toLowerCase().includes(searchLower) ||
        detail.itemId.toString().includes(search)
      );

      const matchesSearch = matchesBasicSearch || matchesItemSearch;

      if (filterStatus === "ALL") return matchesSearch;
      return matchesSearch && loan.loanRequestStatus === filterStatus;
    });
  }, [data, search, filterStatus]);

  const statusOptions: FilterStatus[] = ["ALL", LoanRequestStatus.PENDING, LoanRequestStatus.ONGOING, LoanRequestStatus.COMPLETED, LoanRequestStatus.REJECTED];

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div className="relative w-full sm:max-w-[350px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by requester, ref #, or item name..."
            className="pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`h-8 sm:h-9 rounded-md px-2.5 sm:px-4 text-xs sm:text-sm transition-colors capitalize ${
                filterStatus === status
                  ? "bg-[#0C2C47] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref No</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No loans found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((loan) => (
                <TableRow key={loan.refNo} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLoan(loan)}>
                  <TableCell className="font-medium">#{loan.refNo}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{loan.requester.firstName}{loan.requester.lastName ? ` ${loan.requester.lastName}` : ''}</span>
                      <span className="text-xs text-muted-foreground">@{loan.requester.telegramHandle}</span>
                      {loan.organisation && (
                        <span className="text-xs text-muted-foreground">{loan.organisation}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {loan.loanDetails.slice(0, 2).map((detail) => (
                        <div key={detail.loanDetailId} className="flex items-center gap-1.5 text-xs">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{detail.item.itemDesc}</span>
                          <span className="text-muted-foreground">x{detail.loanQty}</span>
                        </div>
                      ))}
                      {loan.loanDetails.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{loan.loanDetails.length - 2} more</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{format(new Date(loan.loanDateStart), "dd MMM")} - {format(new Date(loan.loanDateEnd), "dd MMM")}</span>
                      {loan.loanRequestStatus === LoanRequestStatus.ONGOING && new Date() > new Date(loan.loanDateEnd) && (
                        <span className="text-xs text-destructive font-medium">Overdue</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={loan.loanRequestStatus} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedLoan(loan); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {loan.loanRequestStatus === LoanRequestStatus.PENDING && (
                        <>
                          <LoanFormModal loan={loan} items={items} mode="edit" />

                          <TooltipProvider>
                            <Tooltip>
                              <AlertDialog
                                open={deleteDialogOpen && deletingRefNo === loan.refNo}
                                onOpenChange={(open) => {
                                  if (!isDeleting) {
                                    setDeleteDialogOpen(open);
                                    if (open) setDeletingRefNo(loan.refNo);
                                  }
                                }}
                              >
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Loan Request</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete loan #{loan.refNo}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <Button
                                      onClick={() => handleDelete(loan.refNo)}
                                      disabled={isDeleting}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isDeleting ? (
                                        <div className="flex items-center gap-2">
                                          <Spinner className="size-4" />
                                          <span>Deleting...</span>
                                        </div>
                                      ) : (
                                        "Delete"
                                      )}
                                    </Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <TooltipContent>Delete loan</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No loans found.
          </div>
        ) : (
          filteredData.map((loan) => (
            <div
              key={loan.refNo}
              className="rounded-xl border bg-white p-4 active:bg-muted/50 transition-colors"
              onClick={() => setSelectedLoan(loan)}
            >
              {/* Top row: Ref + Status */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">#{loan.refNo}</span>
                <StatusBadge status={loan.loanRequestStatus} />
              </div>

              {/* Requester */}
              <div className="mb-2">
                <div className="font-medium text-sm">
                  {loan.requester.firstName}{loan.requester.lastName ? ` ${loan.requester.lastName}` : ''}
                </div>
                <div className="text-xs text-muted-foreground">@{loan.requester.telegramHandle}</div>
                {loan.organisation && (
                  <div className="text-xs text-muted-foreground">{loan.organisation}</div>
                )}
              </div>

              {/* Items preview */}
              <div className="mb-2 space-y-1">
                {loan.loanDetails.slice(0, 2).map((detail) => (
                  <div key={detail.loanDetailId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3 w-3 shrink-0" />
                    <span className="truncate">{detail.item.itemDesc}</span>
                    <span className="shrink-0">x{detail.loanQty}</span>
                  </div>
                ))}
                {loan.loanDetails.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{loan.loanDetails.length - 2} more</span>
                )}
              </div>

              <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3">
                {/* Period */}
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate">{format(new Date(loan.loanDateStart), "dd MMM")} - {format(new Date(loan.loanDateEnd), "dd MMM")}</span>
                  {loan.loanRequestStatus === LoanRequestStatus.ONGOING && new Date() > new Date(loan.loanDateEnd) && (
                    <span className="ml-1 font-medium text-destructive">Overdue</span>
                  )}
                </div>

                {/* Actions for pending loans */}
                {loan.loanRequestStatus === LoanRequestStatus.PENDING && (
                  <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <LoanFormModal
                      loan={loan}
                      items={items}
                      mode="edit"
                      trigger={
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full border-slate-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialog
                      open={deleteDialogOpen && deletingRefNo === loan.refNo}
                      onOpenChange={(open) => {
                        if (!isDeleting) {
                          setDeleteDialogOpen(open);
                          if (open) setDeletingRefNo(loan.refNo);
                        }
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full border-red-200 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Loan Request</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete loan #{loan.refNo}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <Button
                            onClick={() => handleDelete(loan.refNo)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <div className="flex items-center gap-2">
                                <Spinner className="size-4" />
                                <span>Deleting...</span>
                              </div>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal — Item 5: responsive */}
      <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/20 p-3 sm:p-4 rounded-md">
              <div>
                <span className="font-semibold block text-muted-foreground">Requester</span>
                <div className="text-base sm:text-lg">{selectedLoan?.requester.firstName}{selectedLoan?.requester.lastName ? ` ${selectedLoan.requester.lastName}` : ''}</div>
                {selectedLoan?.requester.nusnetId && (
                  <div className="text-sm text-muted-foreground">{selectedLoan.requester.nusnetId}</div>
                )}
              </div>
              <div>
                <span className="font-semibold block text-muted-foreground">Period</span>
                <div className="text-base sm:text-lg">
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
              canApproveLoan(selectedLoan) ? (
                <div className="flex flex-col sm:flex-row gap-2 p-3 sm:p-4 bg-blue-50/50 border border-blue-100 rounded-md sm:items-center sm:justify-between">
                  <div className="text-sm text-blue-800">
                    This request is <strong>Pending Approval</strong>. Approving will mark items as on loan.
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="destructive" size="sm" onClick={() => handleReject(selectedLoan.refNo)} disabled={isPending}>Reject</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => handleApprove(selectedLoan.refNo)} disabled={isPending}>Approve Loan</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md sm:items-center sm:justify-between">
                  <div className="text-sm text-red-800">
                    <strong>Cannot approve:</strong> Some items have insufficient available stock. See details below.
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="destructive" size="sm" onClick={() => handleReject(selectedLoan.refNo)} disabled={isPending}>Reject</Button>
                    <Button className="bg-gray-400 cursor-not-allowed" size="sm" disabled>Approve Loan</Button>
                  </div>
                </div>
              )
            )}

            {/* Items — desktop table */}
            <div className="hidden sm:block border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested</TableHead>
                    {selectedLoan?.loanRequestStatus === LoanRequestStatus.PENDING && (
                      <TableHead>Available</TableHead>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLoan?.loanDetails.map((detail) => {
                    const { available, sufficient } = getItemAvailability(detail.itemId, detail.loanQty);
                    const showAvailability = selectedLoan.loanRequestStatus === LoanRequestStatus.PENDING;

                    return (
                      <TableRow key={detail.loanDetailId} className={showAvailability && !sufficient ? "bg-red-50" : ""}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{detail.item.itemDesc}</span>
                            <span className="text-xs text-muted-foreground">ID: {detail.itemId}</span>
                          </div>
                        </TableCell>
                        <TableCell>{detail.loanQty}</TableCell>
                        {showAvailability && (
                          <TableCell>
                            <span className={sufficient ? "text-green-600" : "text-red-600 font-medium"}>
                              {available}
                              {!sufficient && " (insufficient)"}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <ItemStatusBadge status={detail.loanItemStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedLoan.loanRequestStatus === LoanRequestStatus.ONGOING && detail.loanItemStatus === LoanItemStatus.ON_LOAN && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturnItem(detail.loanDetailId)}
                              disabled={isPending}
                            >
                              {isPending ? "..." : "Return"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Items — mobile card list */}
            <div className="sm:hidden space-y-2">
              {selectedLoan?.loanDetails.map((detail) => {
                const { available, sufficient } = getItemAvailability(detail.itemId, detail.loanQty);
                const showAvailability = selectedLoan.loanRequestStatus === LoanRequestStatus.PENDING;

                return (
                  <div
                    key={detail.loanDetailId}
                    className={`rounded-md border p-3 ${showAvailability && !sufficient ? "bg-red-50 border-red-200" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{detail.item.itemDesc}</div>
                        <div className="text-xs text-muted-foreground">ID: {detail.itemId}</div>
                      </div>
                      <ItemStatusBadge status={detail.loanItemStatus} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        Qty: {detail.loanQty}
                        {showAvailability && (
                          <span className={sufficient ? " text-green-600" : " text-red-600 font-medium"}>
                            {" "}(avail: {available}{!sufficient ? " — insufficient" : ""})
                          </span>
                        )}
                      </div>
                      {selectedLoan.loanRequestStatus === LoanRequestStatus.ONGOING && detail.loanItemStatus === LoanItemStatus.ON_LOAN && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleReturnItem(detail.loanDetailId)}
                          disabled={isPending}
                        >
                          {isPending ? "..." : "Return"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
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

function ItemStatusBadge({ status }: { status: LoanItemStatus }) {
  switch (status) {
    case LoanItemStatus.PENDING:
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">Pending</Badge>;
    case LoanItemStatus.ON_LOAN:
      return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-xs">On Loan</Badge>;
    case LoanItemStatus.RETURNED:
      return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Returned</Badge>;
    case LoanItemStatus.RETURNED_LATE:
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs">Returned Late</Badge>;
    case LoanItemStatus.REJECTED:
      return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}
