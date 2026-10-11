"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  disabled = false,
  className = "",
  triggerClassName = "",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, search]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <DropdownMenu.Root open={open} onOpenChange={handleOpenChange}>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-xs transition-colors hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 text-left",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {selectedOption?.icon && (
                <span className="shrink-0 text-zinc-500">{selectedOption.icon}</span>
              )}
              <span className="truncate font-medium">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.badge && (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-180")} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-60 min-w-[220px] max-w-[420px] w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          >
            {/* Search Input Box */}
            <div className="relative mb-1 px-1.5 pt-1 pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 pl-8 pr-7 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 p-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <DropdownMenu.Item
                      key={opt.value}
                      onSelect={() => {
                        onValueChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs outline-none cursor-pointer transition select-none",
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{opt.label}</span>
                            {opt.badge && (
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase",
                                  isSelected
                                    ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-100 dark:text-zinc-900"
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                )}
                              >
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p
                              className={cn(
                                "text-[10px] truncate leading-tight mt-0.5",
                                isSelected
                                  ? "text-zinc-300 dark:text-zinc-700"
                                  : "text-zinc-400 dark:text-zinc-500"
                              )}
                            >
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-2" />}
                    </DropdownMenu.Item>
                  );
                })
              )}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
