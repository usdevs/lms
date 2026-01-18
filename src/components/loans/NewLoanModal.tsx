"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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

import { CreateLoanSchema } from "@/lib/schema/loan";
import { createLoan } from "@/lib/actions/loan";
import { RequesterSelector, RequesterOption, RequesterSelectorValue } from "./RequesterSelector";
import { ItemSelector, ItemOption } from "./ItemSelector";
import { NewUserDetails } from "@/lib/types/user";

interface NewLoanModalProps {
    requesters: RequesterOption[];
    items: ItemOption[];
}

export function NewLoanModal({ requesters, items }: NewLoanModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // We need to manage the "new requester" state slightly separately from the form 
    // or sync it, since the Select component handles a bit of UI logic.
    // Actually, let's just make the form handle it.

    const form = useForm<z.infer<typeof CreateLoanSchema>>({
        resolver: zodResolver(CreateLoanSchema) as any,
        defaultValues: {
            // @ts-ignore - Date coercion issue
            loanDateStart: new Date(),
            // @ts-ignore - Date coercion issue
            loanDateEnd: new Date(),
            items: [],
            organisation: "",
            eventDetails: "",
            eventLocation: "",
        },
    });

    const selectedItems = form.watch("items");

    // Check if any item exceeds available stock
    const hasOverLimitItems = selectedItems.some(item => {
        const itemInfo = items.find(i => i.itemId === item.itemId);
        const availableQty = itemInfo?.netQty ?? itemInfo?.itemQty ?? 0;
        return item.loanQty > availableQty;
    });

    const onSubmit = (data: z.infer<typeof CreateLoanSchema>) => {
        startTransition(async () => {
            const result = await createLoan(data);
            if (result.success) {
                toast.success("Loan created successfully");
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Failed to create loan");
            }
        });
    };

    const addItem = (itemId: number) => {
        // Add with default qty of 1
        const current = form.getValues("items");
        form.setValue("items", [...current, { itemId, loanQty: 1 }]);
        // Clear items error when an item is added
        form.clearErrors("items");
    };

    const updateItemQty = (index: number, newQty: number | string) => {
        const current = form.getValues("items");
        const updated = [...current];
        // Allow empty string during typing, convert to number
        const qty = typeof newQty === 'string' ? parseInt(newQty) : newQty;
        updated[index].loanQty = isNaN(qty) ? 0 : qty;
        form.setValue("items", updated);
    };

    const validateItemQty = (index: number) => {
        const current = form.getValues("items");
        const updated = [...current];
        // Ensure qty is at least 1
        let qty = updated[index].loanQty;
        if (isNaN(qty) || qty < 1) qty = 1;
        updated[index].loanQty = qty;
        form.setValue("items", updated);
    };

    const removeItem = (index: number) => {
        const current = form.getValues("items");
        form.setValue("items", current.filter((_, i) => i !== index));
    };

    // Requester select handlers
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
            // Clear requester error when a valid requester is selected
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
        // Clear errors as user types (similar to FormField behavior)
        if (details.firstName) {
            form.clearErrors("newRequester.firstName" as any);
        }
        if (details.telegramHandle) {
            form.clearErrors("newRequester.telegramHandle" as any);
        }
        // Clear the general requester error since user is filling in new requester
        form.clearErrors("requesterId");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#FF7D4E] hover:bg-[#FF7D4E]/90 text-white">+ New Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Loan</DialogTitle>
                    <DialogDescription>
                        Record a manually approved loan.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Requester Section */}
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

                        {/* Loan Details */}
                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-semibold text-sm text-foreground/80">Loan Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="loanDateStart"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={e => field.onChange(new Date(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="loanDateEnd"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={e => field.onChange(new Date(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
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
                                    const availableQty = itemInfo?.netQty ?? itemInfo?.itemQty ?? 0;
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
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
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
                                {isPending ? "Creating..." : "Confirm Loan"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
