"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export type ItemOption = {
    itemId: number;
    itemDesc: string;
    itemQty: number; // Remaining stock on shelf (for info)
    totalQty?: number; // Total physical assets
    netQty?: number; // Available - Pending (Effective available)
};

interface ItemSelectorProps {
    availableItems: ItemOption[];
    onAddItem: (itemId: number, qty: number) => void;
}

export function ItemSelector({ availableItems, onAddItem }: ItemSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);
    const [qty, setQty] = React.useState(1);

    const selectedItem = availableItems.find(i => i.itemId === selectedItemId);
    const maxQty = selectedItem?.netQty ?? selectedItem?.itemQty ?? 0;

    const handleAdd = () => {
        if (selectedItemId && qty > 0) {
            onAddItem(selectedItemId, qty);
            // Reset
            setSelectedItemId(null);
            setQty(1);
            setOpen(false);
        }
    };

    return (
        <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-[300px]">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Item</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {selectedItem ? selectedItem.itemDesc : "Select item..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search by name or SN..." />
                            <CommandList>
                                <CommandEmpty>No item found.</CommandEmpty>
                                <CommandGroup>
                                    {availableItems.map((item) => {
                                        // Use netQty if available, else fallback to itemQty
                                        const effectiveStock = item.netQty ?? item.itemQty;
                                        const total = item.totalQty ?? "N/A";

                                        return (
                                            <CommandItem
                                                key={item.itemId}
                                                value={item.itemDesc + " " + item.itemId}
                                                onSelect={() => {
                                                    setSelectedItemId(item.itemId);
                                                    setOpen(false);
                                                }}
                                                disabled={effectiveStock <= 0}
                                                className={cn(effectiveStock <= 0 && "opacity-50")}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedItemId === item.itemId ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col w-full">
                                                    <span className="font-medium">{item.itemDesc}</span>
                                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                        <span>SN: {item.itemId}</span>
                                                        <span className={cn(effectiveStock > 0 ? "text-green-600 font-bold" : "text-destructive")}>
                                                            Avail: {effectiveStock}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="w-[80px]">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Qty</label>
                <Input
                    type="number"
                    min={1}
                    max={Math.max(1, maxQty)}
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    disabled={maxQty <= 0}
                />
            </div>

            <Button onClick={handleAdd} disabled={!selectedItem || qty > maxQty || qty <= 0}>
                Add
            </Button>
        </div>
    );
}
