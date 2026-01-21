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
    telegramHandle: string;
};

// Type for requester select value
export type RequesterSelectorValue = number | "new" | undefined;

interface RequesterSelectorProps {
    requesters: RequesterOption[];
    value: RequesterSelectorValue;
    onChange: (val: RequesterSelectorValue, newDetails?: NewUserDetails) => void;
    onNewDetailsChange?: (details: NewUserDetails) => void;
    errors?: {
        firstName?: string;
        telegramHandle?: string;
        requester?: string;
    };
}

export function RequesterSelector({ requesters, value, onChange, onNewDetailsChange, errors }: RequesterSelectorProps) {
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
            if (!requester) return "Select requester...";
            const fullName = `${requester.firstName}${requester.lastName ? ` ${requester.lastName}` : ''}`;
            return `${fullName} (@${requester.telegramHandle})`;
          })()
        : "Select requester...";

    if (isCreating) {
        return (
            <div 
                className="space-y-3"
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            >
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className={cn(errors?.firstName && "text-destructive")}>First Name *</Label>
                        <Input 
                            value={newDetails.firstName} 
                            onChange={(e) => handleNewChange("firstName", e.target.value)} 
                            placeholder="John"
                            className={cn(errors?.firstName && "border-destructive")}
                        />
                        {errors?.firstName && (
                            <p className="text-destructive text-[0.8rem] font-medium">{errors.firstName}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>Last Name (Optional)</Label>
                        <Input value={newDetails.lastName} onChange={(e) => handleNewChange("lastName", e.target.value)} placeholder="Doe" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className={cn(errors?.telegramHandle && "text-destructive")}>Telegram Handle *</Label>
                        <Input 
                            type="text"
                            value={newDetails.telegramHandle} 
                            onChange={(e) => handleNewChange("telegramHandle", e.target.value)} 
                            placeholder="@username or username"
                            className={cn(errors?.telegramHandle && "border-destructive")}
                        />
                        {errors?.telegramHandle && (
                            <p className="text-destructive text-[0.8rem] font-medium">{errors.telegramHandle}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>NUSNET ID (Optional)</Label>
                        <Input value={newDetails.nusnet} onChange={(e) => handleNewChange("nusnet", e.target.value)} placeholder="E0123456" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between", errors?.requester && "border-destructive")}
                    >
                        {selectedLabel}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="Search requester..." />
                    <CommandList 
                        className="max-h-[300px] overflow-y-auto overscroll-contain"
                        onWheel={(e) => {
                            e.stopPropagation();
                            const target = e.currentTarget;
                            target.scrollTop += e.deltaY;
                        }}
                    >
                        <CommandEmpty>No requester found.</CommandEmpty>
                        <CommandGroup>
                            {requesters.map((req) => {
                                const fullName = `${req.firstName}${req.lastName ? ` ${req.lastName}` : ''}`;
                                const displayName = `${fullName} (@${req.telegramHandle})`;
                                return (
                                    <CommandItem
                                        key={req.userId}
                                        value={`${fullName} ${req.telegramHandle}`}
                                        onSelect={() => {
                                            onChange(req.userId);
                                            setOpen(false);
                                        }}
                                        className="font-normal"
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
                            <CommandItem 
                                onSelect={() => {
                                    onChange("new");
                                    setOpen(false);
                                }}
                                className="font-normal"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Create New Requester
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
        {errors?.requester && (
            <p className="text-destructive text-[0.8rem] font-medium">{errors.requester}</p>
        )}
        </div>
    );
}
