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
import { RequesterSelect, RequesterOption } from "./RequesterSelect";
import { ItemSelector, ItemOption } from "./ItemSelector";

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

    const addItem = (itemId: number, qty: number) => {
        // Check if already added
        const current = form.getValues("items");
        const existingIdx = current.findIndex(i => i.itemId === itemId);

        if (existingIdx >= 0) {
            // Update qty
            const updated = [...current];
            updated[existingIdx].loanQty += qty;
            form.setValue("items", updated);
        } else {
            form.setValue("items", [...current, { itemId, loanQty: qty }]);
        }
    };

    const removeItem = (index: number) => {
        const current = form.getValues("items");
        form.setValue("items", current.filter((_, i) => i !== index));
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>+ New Request</Button>
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
                            <h3 className="font-semibold text-sm text-foreground/80">Requester</h3>
                            <FormField
                                control={form.control}
                                name="requesterId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Requester</FormLabel>
                                        <FormControl>
                                            <RequesterSelect
                                                requesters={requesters}
                                                value={field.value || (form.watch("newRequester") ? "new" : undefined)}
                                                onChange={(val, details) => {
                                                    if (val === "new") {
                                                        field.onChange(undefined);
                                                        form.setValue("newRequester", { firstName: "", lastName: "", nusnet: "", username: "" }); // Init
                                                    } else {
                                                        field.onChange(val);
                                                        form.setValue("newRequester", undefined);
                                                    }
                                                }}
                                                onNewDetailsChange={(d) => {
                                                    form.setValue("newRequester", {
                                                        firstName: d.firstName,
                                                        lastName: d.lastName,
                                                        nusnet: d.nusnet,
                                                        username: d.username,
                                                    });
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Dates & Event Details */}
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


                        {/* Items Section */}
                        <div className="space-y-4 border p-4 rounded-md bg-muted/10">
                            <h3 className="font-semibold text-sm text-foreground/80">Items</h3>

                            <ItemSelector availableItems={items} onAddItem={addItem} />

                            <div className="mt-4 space-y-2">
                                {selectedItems.map((item, idx) => {
                                    const itemInfo = items.find(i => i.itemId === item.itemId);
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-background border rounded shadow-sm">
                                            <div>
                                                <div className="font-medium text-sm">{itemInfo?.itemDesc || "Unknown Item"}</div>
                                                <div className="text-xs text-muted-foreground">Qty: {item.loanQty}</div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                {form.formState.errors.items && (
                                    <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.items.message}
                                    </p>
                                )}
                            </div>
                        </div>


                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Creating..." : "Confirm Loan"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
