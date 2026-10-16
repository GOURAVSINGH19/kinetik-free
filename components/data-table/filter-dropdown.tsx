"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Box, panelClass, triggerClass, usePopover } from "./popover"
import type { DataTableFilter, DataTableOption } from "./types"

export const optionsOf = (options: DataTableOption[]) => options.map((o) => (typeof o === "string" ? { label: o, value: o } : o))

/** A button that opens a checklist of values. Picking none means no filtering. */
export function FilterDropdown({
  filter,
  selected,
  onChange,
}: {
  filter: DataTableFilter
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const { open, setOpen, rootRef, id } = usePopover()
  const options = optionsOf(filter.options)
  const allSelected = options.length > 0 && selected.length === options.length

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass(selected.length > 0)}
      >
        {filter.label}
        {selected.length > 0 && (
          <span className="rounded bg-ui-muted px-1.5 text-xs font-medium text-ui-heading tabular-nums">{selected.length}</span>
        )}
        <ChevronDown className={cn("size-4 text-ui-caption transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          id={id}
          role="group"
          aria-label={`Filter by ${filter.label}`}
          className={cn(panelClass, "left-0 max-h-64 min-w-48")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-ui-border px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ui-heading">
              <input type="checkbox" className="sr-only" checked={allSelected} onChange={() => onChange(allSelected ? [] : options.map((o) => o.value))} />
              <Box checked={allSelected} />
              All
            </label>
            {selected.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                Clear
              </button>
            )}
          </div>
          <div className="overflow-y-auto py-1">
            {options.map((option) => {
              const checked = selected.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-ui-subtle has-[:focus-visible]:bg-ui-subtle",
                    checked ? "font-medium text-ui-heading" : "text-ui-body"
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(option.value)} />
                  <Box checked={checked} />
                  <span className="whitespace-nowrap">{option.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
