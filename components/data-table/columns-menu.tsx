"use client"

import { Columns3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Box, panelClass, triggerClass, usePopover } from "./popover"
import type { DataTableColumn } from "./types"

/** Column title as text, for headers given as JSX (e.g. an sr-only label) falling back to the key. */
const nameOf = <T,>(column: DataTableColumn<T>) =>
  typeof column.header === "string" ? column.header : column.key.replace(/^\w/, (c) => c.toUpperCase())

/** A checklist of the columns that can be hidden. Pinned columns aren't listed: they always stay. */
export function ColumnsMenu<T>({
  columns,
  hidden,
  onChange,
}: {
  columns: DataTableColumn<T>[]
  hidden: string[]
  onChange: (hidden: string[]) => void
}) {
  const { open, setOpen, rootRef, id } = usePopover()
  const hideable = columns.filter((column) => !column.sticky)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Show or hide columns"
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerClass(hidden.length > 0), "px-2.5")}
      >
        <Columns3 className="size-4" aria-hidden />
        {hidden.length > 0 && <span className="rounded bg-ui-muted px-1.5 text-xs font-medium text-ui-heading tabular-nums">{hidden.length}</span>}
      </button>

      {open && (
        <div id={id} role="group" aria-label="Columns" className={cn(panelClass, "right-0 max-h-72 min-w-48")}>
          <p className="border-b border-ui-border px-3 py-2 text-xs font-medium text-ui-caption">Columns</p>
          <div className="overflow-y-auto py-1">
            {hideable.map((column) => {
              const shown = !hidden.includes(column.key)
              return (
                <label
                  key={column.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-ui-subtle has-[:focus-visible]:bg-ui-subtle",
                    shown ? "text-ui-heading" : "text-ui-caption"
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={shown}
                    onChange={() => onChange(shown ? [...hidden, column.key] : hidden.filter((key) => key !== column.key))}
                  />
                  <Box checked={shown} />
                  <span className="whitespace-nowrap">{nameOf(column)}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
