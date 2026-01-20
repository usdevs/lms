"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
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
import { SlocView } from "@/lib/types/slocs";

export interface NewSlocDetails {
  slocName: string;
}

// Type for sloc select value
export type SlocSelectorValue = string | "new" | undefined;

interface SlocSelectorProps {
  slocs: SlocView[];
  value: SlocSelectorValue;
  onChange: (val: SlocSelectorValue) => void;
  onNewDetailsChange?: (details: NewSlocDetails) => void;
  errors?: {
    sloc?: string;
    slocName?: string;
  };
}

export function SlocSelector({ slocs, value, onChange, onNewDetailsChange, errors }: SlocSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // New sloc form state
  const [isCreating, setIsCreating] = React.useState(value === "new");
  const [newDetails, setNewDetails] = React.useState<NewSlocDetails>({ slocName: "" });

  React.useEffect(() => {
    if (value === "new") {
      setIsCreating(true);
    } else {
      setIsCreating(false);
      // Reset new details when not creating
      setNewDetails({ slocName: "" });
    }
  }, [value]);

  const handleNewChange = (val: string) => {
    const updated = { slocName: val };
    setNewDetails(updated);
    onNewDetailsChange?.(updated);
  };

  const selectedLabel = value && value !== "new"
    ? (() => {
        const sloc = slocs.find((s) => s.slocId === value);
        if (!sloc) return "Select location...";
        return sloc.slocName;
      })()
    : "Select location...";

  if (isCreating) {
    return (
      <div 
        className="space-y-1"
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      >
        <div className="flex gap-2">
          <Input 
            value={newDetails.slocName} 
            onChange={(e) => handleNewChange(e.target.value)} 
            placeholder="e.g., Storage Room A"
            className={cn("flex-1", errors?.slocName && "border-destructive")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onChange(undefined)}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {errors?.slocName && (
          <p className="text-destructive text-[0.8rem] font-medium">{errors.slocName}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", errors?.sloc && "border-destructive")}
          >
            {selectedLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search location..." />
            <CommandList 
              className="max-h-[300px] overflow-y-auto overscroll-contain"
              onWheel={(e) => {
                e.stopPropagation();
                const target = e.currentTarget;
                target.scrollTop += e.deltaY;
              }}
            >
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {slocs.map((sloc) => (
                  <CommandItem
                    key={sloc.slocId}
                    value={sloc.slocName}
                    onSelect={() => {
                      onChange(sloc.slocId);
                      setOpen(false);
                    }}
                    className="font-normal"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === sloc.slocId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {sloc.slocName}
                  </CommandItem>
                ))}
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
                  <Plus className="mr-2 h-4 w-4" /> Create New Location
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {errors?.sloc && (
        <p className="text-destructive text-[0.8rem] font-medium">{errors.sloc}</p>
      )}
    </div>
  );
}
