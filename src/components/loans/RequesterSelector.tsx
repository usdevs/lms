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
import { NewUserDetails } from "@/lib/types/user";

// Define a minimal type for what we need from a User
export type RequesterOption = {
    userId: number;
    firstName: string;
    lastName: string | null;
    nusnetId: string | null;
};

// Type for requester select value
export type RequesterSelectorValue = number | "new" | undefined;

interface RequesterSelectorProps {
    requesters: RequesterOption[];
    value: RequesterSelectorValue;
    onChange: (val: RequesterSelectorValue, newDetails?: NewUserDetails) => void;
    onNewDetailsChange?: (details: NewUserDetails) => void;
}

export function RequesterSelector({ requesters, value, onChange, onNewDetailsChange }: RequesterSelectorProps) {
    const [open, setOpen] = React.useState(false);

    // New user form state
    const [isCreating, setIsCreating] = React.useState(value === "new");
    const [newDetails, setNewDetails] = React.useState({ firstName: "", lastName: "", nusnet: "", telegramHandle: "" });

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
        ? (() => {
            const requester = requesters.find((r) => r.userId === value);
            return requester ? `${requester.firstName}${requester.lastName ? ` ${requester.lastName}` : ''}` : "Select requester...";
          })()
        : "Select requester...";

    if (isCreating) {
        return (
            <div className="space-y-3 border p-3 rounded-md bg-muted/20">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">New Requester</h4>
                    <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>Cancel</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>First Name *</Label>
                        <Input value={newDetails.firstName} onChange={(e) => handleNewChange("firstName", e.target.value)} placeholder="John" required />
                    </div>
                    <div>
                        <Label>Last Name (Optional)</Label>
                        <Input value={newDetails.lastName} onChange={(e) => handleNewChange("lastName", e.target.value)} placeholder="Doe" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>Telegram Handle *</Label>
                        <Input 
                            type="text"
                            value={newDetails.telegramHandle} 
                            onChange={(e) => handleNewChange("telegramHandle", e.target.value)} 
                            placeholder="@username or username" 
                            required
                        />
                    </div>
                    <div>
                        <Label>NUSNET ID (Optional)</Label>
                        <Input value={newDetails.nusnet} onChange={(e) => handleNewChange("nusnet", e.target.value)} placeholder="E0123456" />
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
                            {requesters.map((req) => {
                                const fullName = `${req.firstName}${req.lastName ? ` ${req.lastName}` : ''}`;
                                const displayName = req.nusnetId ? `${fullName} (${req.nusnetId})` : fullName;
                                return (
                                    <CommandItem
                                        key={req.userId}
                                        value={fullName + " " + (req.nusnetId || "")}
                                        onSelect={() => {
                                            onChange(req.userId);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === req.userId ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {displayName}
                                    </CommandItem>
                                );
                            })}
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
