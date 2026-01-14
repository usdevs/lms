"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define a minimal type for what we need from a User
export type RequesterOption = {
    reqId: number;
    reqName: string;
    reqNusnet: string;
};

interface RequesterSelectProps {
    requesters: RequesterOption[]; // We will pass pre-fetched requesters
    value: number | "new" | undefined;
    onChange: (val: number | "new" | undefined, newDetails?: { name: string; nusnet: string; tele: string }) => void;
    onNewDetailsChange?: (details: { name: string; nusnet: string; tele: string }) => void;
}

export function RequesterSelect({ requesters, value, onChange, onNewDetailsChange }: RequesterSelectProps) {
    const [open, setOpen] = React.useState(false);

    // New user form state
    const [isCreating, setIsCreating] = React.useState(value === "new");
    const [newDetails, setNewDetails] = React.useState({ name: "", nusnet: "", tele: "" });

    React.useEffect(() => {
        if (value === "new") {
            setIsCreating(true);
        } else {
            setIsCreating(false);
        }
    }, [value]);

    const handleNewChange = (field: string, val: string) => {
        const updated = { ...newDetails, [field]: val };
        setNewDetails(updated);
        onNewDetailsChange?.(updated);
    };

    const selectedLabel = value && value !== "new"
        ? requesters.find((r) => r.reqId === value)?.reqName
        : "Select requester...";

    if (isCreating) {
        return (
            <div className="space-y-3 border p-3 rounded-md bg-muted/20">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">New Requester</h4>
                    <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>Cancel</Button>
                </div>
                <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={newDetails.name} onChange={(e) => handleNewChange("name", e.target.value)} placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>NUSNET ID</Label>
                        <Input value={newDetails.nusnet} onChange={(e) => handleNewChange("nusnet", e.target.value)} placeholder="E0123456" />
                    </div>
                    <div>
                        <Label>Telehandle (Optional)</Label>
                        <Input value={newDetails.tele} onChange={(e) => handleNewChange("tele", e.target.value)} placeholder="@jhndoe" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedLabel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="Search requester..." />
                    <CommandList>
                        <CommandEmpty>No requester found.</CommandEmpty>
                        <CommandGroup>
                            {requesters.map((req) => (
                                <CommandItem
                                    key={req.reqId}
                                    value={req.reqName + " " + req.reqNusnet}
                                    onSelect={() => {
                                        onChange(req.reqId);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === req.reqId ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {req.reqName} ({req.reqNusnet})
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem onSelect={() => {
                                onChange("new");
                                setOpen(false);
                            }}>
                                <Plus className="mr-2 h-4 w-4" /> create New Requester
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
