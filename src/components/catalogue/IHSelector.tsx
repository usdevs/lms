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
import { IHView } from "@/lib/types/ih";

interface IHSelectorProps {
  ihs: IHView[];
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  error?: string;
}

// Helper to get telegram handle from IH's primary member
function getIHTelegramHandle(ih: IHView): string | null {
  const primaryMember = ih.members?.[0];
  return primaryMember?.user?.telegramHandle ?? null;
}

export function IHSelector({ ihs, value, onChange, error }: IHSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(() => {
    if (!value) return "Select holder...";
    const ih = ihs.find((h) => h.ihId === value);
    if (!ih) return "Select holder...";
    const handle = getIHTelegramHandle(ih);
    return handle ? `${ih.ihName} (@${handle})` : ih.ihName;
  }, [value, ihs]);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", error && "border-destructive")}
          >
            {selectedLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search by name or @handle..." />
            <CommandList 
              className="max-h-[300px] overflow-y-auto overscroll-contain"
              onWheel={(e) => {
                e.stopPropagation();
                const target = e.currentTarget;
                target.scrollTop += e.deltaY;
              }}
            >
              <CommandEmpty>No holder found.</CommandEmpty>
              <CommandGroup>
                {ihs.map((ih) => {
                  const handle = getIHTelegramHandle(ih);
                  // Include handle in searchable value
                  const searchValue = handle
                    ? `${ih.ihName} ${handle}`
                    : ih.ihName;
                  const displayName = handle
                    ? `${ih.ihName} (@${handle})`
                    : ih.ihName;

                  return (
                    <CommandItem
                      key={ih.ihId}
                      value={searchValue}
                      onSelect={() => {
                        onChange(ih.ihId);
                        setOpen(false);
                      }}
                      className="font-normal"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === ih.ihId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {displayName}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-destructive text-[0.8rem] font-medium">{error}</p>
      )}
    </div>
  );
}
