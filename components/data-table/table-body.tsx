import type { CSSProperties, ReactNode } from "react"
import { CircleAlert, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Box } from "./popover"
import type { DataTableColumn } from "./types"

export const alignClass = { left: "text-left", center: "text-center", right: "text-right" } as const

/** Pinned columns stay in view while the table scrolls sideways; a hairline marks their edge. */
export const stickyClass = (column: DataTableColumn<never>) =>
  column.sticky === "left"
    ? "sticky left-0 z-10 shadow-[inset_-1px_0_0_var(--ui-border)]"
    : column.sticky === "right"
      ? "sticky right-0 z-10 shadow-[inset_1px_0_0_var(--ui-border)]"
      : ""

/** Width of the checkbox column. A left-pinned column sits this far in, beside it. */
export const SELECT_WIDTH = 44

/** A cell's min width, plus its offset from the left edge when pinned beside the checkbox column. */
export const cellStyle = (column: DataTableColumn<never>, leftOffset: number): CSSProperties => ({
  minWidth: column.minWidth,
  ...(column.sticky === "left" && leftOffset ? { left: leftOffset } : {}),
})

/** The checkbox cell's classes; it pins with the table's left-pinned column, if there is one. */
export const selectCellClass = (pinned: boolean) =>
  cn("w-11 min-w-11 px-0 text-center", pinned && "sticky left-0 z-10")

export interface RowSelection<T> {
  keyOf: (row: T, index: number) => string | number
  isSelected: (key: string | number) => boolean
  toggle: (key: string | number, row: T) => void
  pinned: boolean
}

/** A row's checkbox: a native input for keyboard and screen readers, drawn as Box. */
export function SelectBox({ checked, mixed = false, label, onChange }: { checked: boolean; mixed?: boolean; label: string; onChange: () => void }) {
  return (
    <label className="inline-grid cursor-pointer place-items-center rounded p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ui-border-strong">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        aria-checked={mixed ? "mixed" : checked}
        aria-label={label}
        onChange={onChange}
      />
      <Box checked={checked} mixed={mixed} />
    </label>
  )
}

const cellBase = "border-b border-ui-border-subtle px-4 py-3 text-sm text-ui-body"

function Message({ colSpan, icon, children, tone = "muted" }: { colSpan: number; icon: ReactNode; children: ReactNode; tone?: "muted" | "error" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <div className={cn("flex flex-col items-center gap-2.5 text-sm", tone === "error" ? "text-red-600 dark:text-red-400" : "text-ui-caption")}>
          <span className={cn("grid size-11 place-items-center rounded-full", tone === "error" ? "bg-red-500/10" : "bg-ui-muted")}>{icon}</span>
          {children}
        </div>
      </td>
    </tr>
  )
}

export function TableBody<T>({
  columns,
  rows,
  rowKey,
  loading,
  loadingRows,
  error,
  emptyMessage,
  wrap = false,
  selection,
  leftOffset = 0,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey?: (row: T, index: number) => string | number
  loading: boolean
  loadingRows: number
  error?: ReactNode
  emptyMessage: ReactNode
  /** Let long text wrap instead of widening the column. */
  wrap?: boolean
  /** Adds a checkbox cell to the start of each row. */
  selection?: RowSelection<T>
  /** How far a left-pinned column sits from the edge (the checkbox column's width). */
  leftOffset?: number
}) {
  const span = columns.length + (selection ? 1 : 0)
  if (loading) {
    return (
      <tbody aria-busy>
        {Array.from({ length: loadingRows }, (_, r) => (
          <tr key={r}>
            {selection && <td className={cn(cellBase, "bg-ui-bg", selectCellClass(selection.pinned))} />}
            {columns.map((column) => (
              <td
                key={column.key}
                style={cellStyle(column as DataTableColumn<never>, leftOffset)}
                className={cn(cellBase, "bg-ui-bg", stickyClass(column as DataTableColumn<never>))}
              >
                <div className="h-4 animate-pulse rounded-md bg-ui-muted" style={{ width: `${55 + ((r * 7 + column.key.length * 13) % 40)}%` }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  if (error) {
    return (
      <tbody>
        <Message colSpan={span} tone="error" icon={<CircleAlert className="size-5" aria-hidden />}>
          {error}
        </Message>
      </tbody>
    )
  }

  if (rows.length === 0) {
    return (
      <tbody>
        <Message colSpan={span} icon={<Inbox className="size-5" aria-hidden />}>
          {emptyMessage}
        </Message>
      </tbody>
    )
  }

  return (
    <tbody>
      {rows.map((row, index) => {
        const key = selection ? selection.keyOf(row, index) : rowKey ? rowKey(row, index) : index
        const selected = selection?.isSelected(key) ?? false
        return (
        <tr key={key} className="group/row" aria-selected={selection ? selected : undefined}>
          {selection && (
            <td
              className={cn(
                cellBase,
                "bg-ui-bg transition-colors group-last/row:border-b-0 group-hover/row:bg-ui-subtle",
                selected && "bg-ui-subtle",
                selectCellClass(selection.pinned)
              )}
            >
              <SelectBox checked={selected} label="Select row" onChange={() => selection.toggle(key, row)} />
            </td>
          )}
          {columns.map((column) => (
            <td
              key={column.key}
              style={cellStyle(column as DataTableColumn<never>, leftOffset)}
              className={cn(
                cellBase,
                // Every cell takes the row's hover colour, so pinned cells hover with their row.
                "bg-ui-bg transition-colors group-last/row:border-b-0 group-hover/row:bg-ui-subtle",
                selected && "bg-ui-subtle",
                // Fitting the box: text wraps and cells tighten up a little.
                wrap ? "px-3 break-words" : "whitespace-nowrap",
                alignClass[column.align ?? "left"],
                stickyClass(column as DataTableColumn<never>),
                column.className
              )}
            >
              {column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}
            </td>
          ))}
        </tr>
        )
      })}
    </tbody>
  )
}
