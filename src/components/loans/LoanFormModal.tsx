"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { CreateLoanSchema } from "@/lib/schema/loan";
import { createLoan, updateLoan } from "@/lib/actions/loan";
import { RequesterSelector, RequesterOption, RequesterSelectorValue } from "./RequesterSelector";
import { ItemSelector, ItemOption } from "./ItemSelector";
import { NewUserDetails } from "@/lib/types/user";
import { LoanWithDetails } from "@/lib/types/loans";

// Schema for editing (subset of create - no requester changes allowed)
const EditLoanSchema = z.object({
    loanDateStart: z.coerce.date(),
    loanDateEnd: z.coerce.date(),
    organisation: z.string().optional(),
    eventDetails: z.string().optional(),
    eventLocation: z.string().optional(),
    items: z.array(z.object({
        itemId: z.number(),
        loanQty: z.number().min(1, "Quantity must be at least 1"),
    })).min(1, "At least one item is required"),
});

interface LoanFormModalProps {
    items: ItemOption[];
    requesters?: RequesterOption[];
    loan?: LoanWithDetails;
    mode?: "add" | "edit";
    trigger?: React.ReactNode;
}

export function LoanFormModal({ 
    items, 
    requesters = [], 
    loan, 
    mode = "add",
    trigger 
}: LoanFormModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const defaultValues = useMemo(() => {
        if (mode === "edit" && loan) {
            return {
                loanDateStart: new Date(loan.loanDateStart),
                loanDateEnd: new Date(loan.loanDateEnd),
                organisation: loan.organisation || "",
                eventDetails: loan.eventDetails || "",
                eventLocation: loan.eventLocation || "",
                items: loan.loanDetails.map(d => ({
                    itemId: d.itemId,
                    loanQty: d.loanQty,
                })),
            };
        }
        return {
            loanDateStart: new Date(),
            loanDateEnd: new Date(),
            items: [],
            organisation: "",
            eventDetails: "",
            eventLocation: "",
        };
    }, [mode, loan]);

    const form = useForm<z.infer<typeof CreateLoanSchema>>({
        resolver: zodResolver(mode === "edit" ? EditLoanSchema : CreateLoanSchema) as any,
        defaultValues,
    });

    // Reset form when loan changes (for edit mode)
    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const selectedItems = form.watch("items");

    // Check if any item exceeds available stock
    const hasOverLimitItems = selectedItems.some(item => {
        const itemInfo = items.find(i => i.itemId === item.itemId);
        // For editing, add back the current loan's qty to available
        const currentLoanQty = mode === "edit" && loan 
            ? loan.loanDetails.find(d => d.itemId === item.itemId)?.loanQty || 0 
            : 0;
        const availableQty = (itemInfo?.netQty ?? itemInfo?.itemQty ?? 0) + currentLoanQty;
        return item.loanQty > availableQty;
    });

    const onSubmit = (data: z.infer<typeof CreateLoanSchema>) => {
        startTransition(async () => {
            if (mode === "edit" && loan) {
                const result = await updateLoan(loan.refNo, {
                    loanDateStart: data.loanDateStart,
                    loanDateEnd: data.loanDateEnd,
                    organisation: data.organisation,
                    eventDetails: data.eventDetails,
                    eventLocation: data.eventLocation,
                    items: data.items,
                });
                if (result.success) {
                    toast.success("Loan updated successfully");
                    setOpen(false);
                } else {
                    toast.error(result.error || "Failed to update loan");
                }
            } else {
                const result = await createLoan(data);
                if (result.success) {
                    toast.success("Loan created successfully");
                    setOpen(false);
                    form.reset(defaultValues);
                } else {
                    toast.error(result.error || "Failed to create loan");
                }
            }
        });
    };

    const addItem = (itemId: number) => {
        const current = form.getValues("items");
        form.setValue("items", [...current, { itemId, loanQty: 1 }]);
        form.clearErrors("items");
    };

    const updateItemQty = (index: number, newQty: number | string) => {
        const current = form.getValues("items");
        const updated = [...current];
        const qty = typeof newQty === 'string' ? parseInt(newQty) : newQty;
        updated[index].loanQty = isNaN(qty) ? 0 : qty;
        form.setValue("items", updated);
    };

    const validateItemQty = (index: number) => {
        const current = form.getValues("items");
        const updated = [...current];
        let qty = updated[index].loanQty;
        if (isNaN(qty) || qty < 1) qty = 1;
        updated[index].loanQty = qty;
        form.setValue("items", updated);
    };

    const removeItem = (index: number) => {
        const current = form.getValues("items");
        form.setValue("items", current.filter((_, i) => i !== index));
    };

    // Requester handlers (only for add mode)
    const handleRequesterChange = (val: RequesterSelectorValue, details?: NewUserDetails) => {
        if (val === "new") {
            form.setValue("requesterId", undefined);
            form.setValue("newRequester", { 
                firstName: "", 
                lastName: "", 
                nusnet: "", 
                telegramHandle: "" 
            });
        } else {
            form.setValue("requesterId", val);
            form.setValue("newRequester", undefined);
            if (val) {
                form.clearErrors("requesterId");
            }
        }
    };

    const handleNewRequesterDetailsChange = (details: NewUserDetails) => {
        form.setValue("newRequester", {
            firstName: details.firstName,
            lastName: details.lastName,
            nusnet: details.nusnet,
            telegramHandle: details.telegramHandle,
            ...(details.role && { role: details.role }),
        });
        if (details.firstName) {
            form.clearErrors("newRequester.firstName" as any);
        }
        if (details.telegramHandle) {
            form.clearErrors("newRequester.telegramHandle" as any);
        }
        form.clearErrors("requesterId");
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset(defaultValues);
        }
    };

    const defaultTrigger = mode === "add" ? (
        <Button className="bg-[#FF7D4E] hover:bg-[#FF7D4E]/90 text-white">+ New Request</Button>
    ) : (
        <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
        </Button>
    );

    const triggerElement = trigger || defaultTrigger;

    // Calculate available qty for display
    const getAvailableQty = (itemId: number) => {
        const itemInfo = items.find(i => i.itemId === itemId);
        const currentLoanQty = mode === "edit" && loan 
            ? loan.loanDetails.find(d => d.itemId === itemId)?.loanQty || 0 
            : 0;
        return (itemInfo?.netQty ?? itemInfo?.itemQty ?? 0) + currentLoanQty;
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {mode === "edit" ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                {triggerElement}
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Edit loan</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <DialogTrigger asChild>
                    {triggerElement}
                </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "edit" ? `Edit Loan #${loan?.refNo}` : "Create New Loan"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "edit" 
                            ? "Update loan details. Only pending loans can be edited."
                            : "Record a manually approved loan."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Requester Section - only for add mode */}
                        {mode === "add" ? (
                            <div className="space-y-4 border p-4 rounded-md">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm text-foreground/80">
                                        {form.watch("newRequester") ? "New Requester" : "Requester"}
                                    </h3>
                                    {form.watch("newRequester") && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRequesterChange(undefined)}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                                <FormField
                                    control={form.control}
                                    name="requesterId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <RequesterSelector
                                                    requesters={requesters}
                                                    value={field.value || (form.watch("newRequester") ? "new" : undefined)}
                                                    onChange={handleRequesterChange}
                                                    onNewDetailsChange={handleNewRequesterDetailsChange}
                                                    errors={{
                                                        requester: form.formState.errors.requesterId?.message || form.formState.errors.newRequester?.message,
                                                        firstName: (form.formState.errors.newRequester as any)?.firstName?.message,
                                                        telegramHandle: (form.formState.errors.newRequester as any)?.telegramHandle?.message,
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ) : loan && (
                            <div className="space-y-2 border p-4 rounded-md bg-muted/20">
                                <h3 className="font-semibold text-sm text-foreground/80">Requester</h3>
                                <div className="text-sm">
                                    <span className="font-medium">
                                        {loan.requester.firstName}
                                        {loan.requester.lastName ? ` ${loan.requester.lastName}` : ''}
                                    </span>
                                    {loan.requester.nusnetId && (
                                        <span className="text-muted-foreground ml-2">({loan.requester.nusnetId})</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Loan Details */}
                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-semibold text-sm text-foreground/80">Loan Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="loanDateStart"
                                    render={({ field }) => {
                                        // Format date for input without timezone conversion
                                        const formatDateForInput = (date: Date | null | undefined) => {
                                            if (!date) return '';
                                            const d = new Date(date);
                                            const year = d.getFullYear();
                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                            const day = String(d.getDate()).padStart(2, '0');
                                            return `${year}-${month}-${day}`;
                                        };
                                        return (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        value={formatDateForInput(field.value)}
                                                        onChange={e => {
                                                            // Parse as local date to avoid timezone shift
                                                            const [year, month, day] = e.target.value.split('-').map(Number);
                                                            field.onChange(new Date(year, month - 1, day));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField
                                    control={form.control}
                                    name="loanDateEnd"
                                    render={({ field }) => {
                                        // Format date for input without timezone conversion
                                        const formatDateForInput = (date: Date | null | undefined) => {
                                            if (!date) return '';
                                            const d = new Date(date);
                                            const year = d.getFullYear();
                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                            const day = String(d.getDate()).padStart(2, '0');
                                            return `${year}-${month}-${day}`;
                                        };
                                        return (
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        value={formatDateForInput(field.value)}
                                                        onChange={e => {
                                                            // Parse as local date to avoid timezone shift
                                                            const [year, month, day] = e.target.value.split('-').map(Number);
                                                            field.onChange(new Date(year, month - 1, day));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="organisation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organisation (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Freshman Orientation Project" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4 border p-4 rounded-md bg-muted/10">
                            <h3 className="font-semibold text-sm text-foreground/80">Items</h3>

                            <ItemSelector 
                                availableItems={items} 
                                selectedItemIds={selectedItems.map(i => i.itemId)} 
                                onAddItem={addItem} 
                            />

                            <div className="mt-4 space-y-2">
                                {selectedItems.map((item, idx) => {
                                    const itemInfo = items.find(i => i.itemId === item.itemId);
                                    const availableQty = getAvailableQty(item.itemId);
                                    const isOverLimit = item.loanQty > availableQty;
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-background border rounded shadow-sm">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{itemInfo?.itemDesc || "Unknown Item"}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {isOverLimit ? (
                                                        <span className="text-destructive">Exceeds available ({availableQty})</span>
                                                    ) : (
                                                        <>Available: {availableQty}</>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-muted-foreground">Qty:</label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.loanQty || ''}
                                                        onChange={(e) => updateItemQty(idx, e.target.value)}
                                                        onBlur={() => validateItemQty(idx)}
                                                        className={`w-20 h-8 ${isOverLimit ? 'border-destructive' : ''}`}
                                                    />
                                                </div>
                                                <Button 
                                                    type="button"
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-destructive" 
                                                    onClick={() => removeItem(idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                                {form.formState.errors.items && (
                                    <p className="text-[0.8rem] font-medium text-destructive">
                                        {form.formState.errors.items.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending || hasOverLimitItems}>
                                {isPending 
                                    ? (mode === "edit" ? "Saving..." : "Creating...") 
                                    : (mode === "edit" ? "Save Changes" : "Confirm Loan")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
