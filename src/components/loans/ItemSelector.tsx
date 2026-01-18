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

export type ItemOption = {
    itemId: number;
    itemDesc: string;
    itemQty: number; // Remaining stock on shelf (for info)
    totalQty?: number; // Total physical assets
    netQty?: number; // Available - Pending (Effective available)
};

interface ItemSelectorProps {
    availableItems: ItemOption[];
    selectedItemIds: number[]; // IDs of items already added to the loan
    onAddItem: (itemId: number) => void;
}

export function ItemSelector({ availableItems, selectedItemIds, onAddItem }: ItemSelectorProps) {
    const [open, setOpen] = React.useState(false);

    // Filter out items that are already selected
    const filteredItems = availableItems.filter(item => !selectedItemIds.includes(item.itemId));

    const handleSelect = (itemId: number) => {
        onAddItem(itemId);
        setOpen(false);
    };

    return (
        <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Item</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        Select item to add...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search by name or SN..." />
                            <CommandList 
                                className="max-h-[300px] overflow-y-auto overscroll-contain"
                                onWheel={(e) => {
                                    e.stopPropagation();
                                    const target = e.currentTarget;
                                    target.scrollTop += e.deltaY;
                                }}
                            >
                                <CommandEmpty>No item found.</CommandEmpty>
                                <CommandGroup>
                                    {filteredItems.map((item) => {
                                        // Use netQty if available, else fallback to itemQty
                                        const effectiveStock = item.netQty ?? item.itemQty;
                                        const total = item.totalQty ?? "N/A";

                                        return (
                                            <CommandItem
                                                key={item.itemId}
                                                value={item.itemDesc + " " + item.itemId}
                                                onSelect={() => handleSelect(item.itemId)}
                                                disabled={effectiveStock <= 0}
                                                className={cn(effectiveStock <= 0 && "opacity-50")}
                                            >
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
    );
}
