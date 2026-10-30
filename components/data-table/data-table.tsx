"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, LayoutGrid, Search, X } from "lucide-react"
import { SlidingTabs } from "@/components/sliding-tabs/sliding-tabs"
import { cn } from "@/lib/utils"
import { ColumnsMenu } from "./columns-menu"
import { ConfirmDialog } from "./confirm-dialog"
import { DateRangePicker } from "./date-range-picker"
import { FilterDropdown, optionsOf } from "./filter-dropdown"
import { Pagination } from "./pagination"
import { SelectionBar } from "./selection-bar"
import { UndoToast } from "./undo-toast"
import { alignClass, cellStyle, SELECT_WIDTH, SelectBox, selectCellClass, stickyClass, TableBody, type RowSelection } from "./table-body"
import type { DataTableColumn, DataTableProps } from "./types"
import { useTableState } from "./use-table-state"

/** The tab value that means "every row"; real values come from the data. */
const ALL = "__all__"

const justify = { left: "justify-start", center: "justify-center", right: "justify-end" } as const

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    rowKey,
    title,
    description,
    searchable = false,
    searchPlaceholder = "Search…",
    filters = [],
    tabs,
    dateRange,
    selectable = false,
    onSelectionChange,
    onDeleteRows,
    bulkActions,
    rowNoun = ["row", "rows"],
    columnToggle = false,
    pageSizeOptions,
    manual = false,
    loading = false,
    error,
    emptyMessage = "No results",
    loadingRows = 6,
    scrollable = true,
    className,
  } = props
  // A single delete skips the dialog: the row hides at once and Undo stays on offer, then the delete is reported.
  const [removing, setRemoving] = useState<T[] | null>(null)
  const data = useMemo(() => (removing ? props.data.filter((row) => !removing.includes(row)) : props.data), [props.data, removing])
  const table = useTableState({ ...props, data })
  const { pageSize } = table

  // Hidden columns. Pinned ones always show, so the table never loses its anchor columns.
  const [hidden, setHidden] = useState<string[]>(props.defaultHiddenColumns ?? [])
  const shown = columns.filter((column) => column.sticky || !hidden.includes(column.key))

  // Picked rows by key, kept across pages, searches and filters.
  const [picked, setPicked] = useState<Map<string | number, T>>(() => new Map())
  const pickAll = (next: Map<string | number, T>) => {
    setPicked(next)
    onSelectionChange?.([...next.keys()], [...next.values()])
  }
  const pinnedLeft = shown.some((column) => column.sticky === "left")
  const selection: RowSelection<T> | undefined = selectable
    ? {
        // Without rowKey the absolute row number stands in, which holds while the order does.
        keyOf: (row, index) => (rowKey ? rowKey(row, index) : (table.page - 1) * pageSize + index),
        isSelected: (key) => picked.has(key),
        toggle: (key, row) => {
          const next = new Map(picked)
          if (next.has(key)) next.delete(key)
          else next.set(key, row)
          pickAll(next)
        },
        pinned: pinnedLeft,
      }
    : undefined
  const pageKeys = selection ? table.visible.map((row, index) => selection.keyOf(row, index)) : []
  const pagePicked = pageKeys.filter((key) => picked.has(key)).length
  const togglePage = () => {
    const next = new Map(picked)
    if (pagePicked === pageKeys.length) pageKeys.forEach((key) => next.delete(key))
    else table.visible.forEach((row, index) => next.set(pageKeys[index]!, row))
    pickAll(next)
  }
  const leftOffset = selectable && pinnedLeft ? SELECT_WIDTH : 0
  const clearPicks = () => pickAll(new Map())

  // Rows that leave `data` (deleted, say) leave the selection too. Needs rowKey to know them.
  useEffect(() => {
    if (!rowKey || picked.size === 0) return
    const present = new Set(data.map((row, index) => rowKey(row, index)))
    if ([...picked.keys()].every((key) => present.has(key))) return
    pickAll(new Map([...picked].filter(([key]) => present.has(key))))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the data changes
  }, [props.data])

  // The selection bar covers the header row exactly, so it needs that row's height.
  const headRef = useRef<HTMLTableSectionElement>(null)
  const [headHeight, setHeadHeight] = useState(44)
  useLayoutEffect(() => {
    const head = headRef.current
    if (!head) return
    const measure = () => setHeadHeight(head.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(head)
    return () => observer.disconnect()
  }, [])

  // Soft white fades beside the pinned columns say there is more to scroll to on that side.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: 0, right: 0, canLeft: false, canRight: false })
  const layoutKey = shown.map((column) => `${column.key}:${column.sticky ?? ""}`).join() + selectable
  useLayoutEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const measure = () => {
      const widthOf = (side: "left-0" | "right-0") =>
        [...box.querySelectorAll<HTMLElement>("thead th")].filter((th) => th.classList.contains(side)).reduce((sum, th) => sum + th.offsetWidth, 0)
      const next = {
        left: widthOf("left-0"),
        right: widthOf("right-0"),
        canLeft: box.scrollLeft > 1,
        canRight: box.scrollLeft + box.clientWidth < box.scrollWidth - 1,
      }
      setEdges((prev) => (prev.left === next.left && prev.right === next.right && prev.canLeft === next.canLeft && prev.canRight === next.canRight ? prev : next))
    }
    measure()
    box.addEventListener("scroll", measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    if (box.firstElementChild) observer.observe(box.firstElementChild)
    return () => {
      box.removeEventListener("scroll", measure)
      observer.disconnect()
    }
  }, [layoutKey])

  const [confirming, setConfirming] = useState(false)
  const noun = (count: number) => `${count} ${count === 1 ? rowNoun[0] : rowNoun[1]}`
  const deletingAll = picked.size > 0 && picked.size === data.length

  const hasControls = Boolean(filters.length || searchable || dateRange || columnToggle)
  const hasToolbar = Boolean(title || description || hasControls || tabs)
  const showPagination = !loading && !error && table.total > 0 && (table.pageCount > 1 || !manual || Boolean(pageSizeOptions))
  const first = (table.page - 1) * pageSize + 1
  const range = manual
    ? `Page ${table.page} of ${table.pageCount}`
    : table.total === 0
      ? "No results"
      : `Showing ${first}–${Math.min(first + table.visible.length - 1, table.total)} of ${table.total}`
  const summary = selectable && picked.size > 0 ? `${picked.size} selected · ${range}` : range

  const controls = hasControls && (
    <div className={cn("flex min-w-0 flex-1 flex-nowrap items-center gap-2 sm:justify-end", tabs && "max-sm:basis-full sm:ms-auto sm:flex-initial")}>
      {searchable && (
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-ui-border bg-ui-bg px-3 text-ui-caption focus-within:ring-2 focus-within:ring-ui-border-strong sm:w-48 sm:min-w-24 sm:shrink">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={table.query}
            onChange={(event) => table.search(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search the table"
            className="w-full min-w-0 bg-transparent text-sm text-ui-heading outline-none placeholder:text-ui-hint [&::-webkit-search-cancel-button]:appearance-none"
          />
          {table.query && (
            <button type="button" onClick={() => table.search("")} aria-label="Clear search" className="rounded text-ui-caption hover:text-ui-heading">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </label>
      )}
      {dateRange && <DateRangePicker label={dateRange.label} value={table.dateRange} onChange={table.selectDates} />}
      {filters.map((filter) => (
        <FilterDropdown
          key={filter.key}
          filter={filter}
          selected={table.filterValues[filter.key] ?? []}
          onChange={(values) => table.filter(filter.key, values)}
        />
      ))}
      {columnToggle && <ColumnsMenu columns={columns} hidden={hidden} onChange={setHidden} />}
    </div>
  )

  return (
    // No overflow-hidden here, so filter menus can open past the edge of a short table.
    <div className={cn("relative w-full rounded-md border border-ui-border bg-ui-bg", className)}>
      {hasToolbar && (
        <div className="flex flex-col gap-3 border-b border-ui-border px-4 py-3">
          {(title || description || (!tabs && controls)) && (
            <div className="flex flex-wrap items-end justify-between gap-3">
              {(title || description) && (
                <div className="min-w-0">
                  {title && <h3 className="text-sm font-semibold text-ui-heading">{title}</h3>}
                  {description && <p className="mt-0.5 text-xs text-ui-caption">{description}</p>}
                </div>
              )}
              {!tabs && controls}
            </div>
          )}
          {tabs && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="max-w-full min-w-0 overflow-x-auto">
                <SlidingTabs
                  label={`Filter by ${tabs.key}`}
                  collapse="auto"
                  tabs={[
                    { value: ALL, label: tabs.allLabel ?? "All", icon: tabs.allIcon ?? <LayoutGrid /> },
                    ...optionsOf(tabs.options).map((option) => ({
                      value: option.value,
                      label: option.label,
                      icon: "icon" in option && option.icon ? option.icon : <span className="text-xs font-semibold">{option.label.charAt(0)}</span>,
                    })),
                  ]}
                  value={table.tab ?? ALL}
                  onValueChange={(value) => table.selectTab(value === ALL ? null : value)}
                />
              </div>
              {controls}
            </div>
          )}
        </div>
      )}

      {/* The selection bar sits outside the scroll area, so it stays put while the columns scroll. */}
      <div className="relative">
      {selectable && (
        <SelectionBar
          count={picked.size}
          offset={SELECT_WIDTH}
          height={headHeight}
          onDelete={
            onDeleteRows
              ? () => {
                  if (picked.size !== 1) return setConfirming(true)
                  // A delete still waiting on its toast is settled first, so none is dropped.
                  if (removing) onDeleteRows(removing)
                  setRemoving([...picked.values()])
                  clearPicks()
                }
              : undefined
          }
          onClear={clearPicks}
        >
          {bulkActions?.([...picked.values()], clearPicks)}
        </SelectionBar>
      )}
      {/* The scroll area rounds the corners it shares with the outer box. */}
      <div ref={scrollRef} className={cn("overflow-x-auto", !hasToolbar && "rounded-t-md", !showPagination && "rounded-b-md")}>
        <table className={cn("w-full border-separate border-spacing-0", scrollable && "min-w-max")}>
          <thead ref={headRef}>
            <tr>
              {selection && (
                <th scope="col" className={cn("border-r border-b border-ui-border bg-ui-subtle py-2.5 align-middle", selectCellClass(selection.pinned), selection.pinned && "z-20")}>
                  <SelectBox
                    checked={pageKeys.length > 0 && pagePicked === pageKeys.length}
                    mixed={pagePicked > 0 && pagePicked < pageKeys.length}
                    label="Select every row on this page"
                    onChange={togglePage}
                  />
                </th>
              )}
              {shown.map((column) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  sort={table.sort}
                  wrap={!scrollable}
                  leftOffset={leftOffset}
                  onSort={() => table.toggleSort(column.key)}
                />
              ))}
            </tr>
          </thead>
          <TableBody
            columns={shown}
            selection={selection}
            leftOffset={leftOffset}
            rows={table.visible}
            rowKey={rowKey}
            loading={loading}
            loadingRows={loadingRows}
            error={error}
            emptyMessage={emptyMessage}
            wrap={!scrollable}
          />
        </table>
      </div>
      {(["left", "right"] as const).map((side) => (
        <span
          key={side}
          aria-hidden
          style={{ [side]: side === "left" ? edges.left : edges.right }}
          className={cn(
            "pointer-events-none absolute top-0 bottom-0 z-10 w-12 backdrop-blur-[3px] transition-opacity duration-200",
            side === "left"
              ? "bg-gradient-to-r from-ui-bg to-transparent [mask-image:linear-gradient(to_right,black,transparent)]"
              : "bg-gradient-to-l from-ui-bg to-transparent [mask-image:linear-gradient(to_left,black,transparent)]",
            (side === "left" ? edges.canLeft : edges.canRight) ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      </div>

      {showPagination && (
        <Pagination
          page={table.page}
          pageCount={table.pageCount}
          onChange={table.goTo}
          summary={summary}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={table.resize}
        />
      )}

      {onDeleteRows && removing && (
        <UndoToast
          key={rowKey ? rowKey(removing[0]!, 0) : undefined}
          message={`1 ${rowNoun[0]} deleted`}
          onUndo={() => setRemoving(null)}
          onDone={() => {
            onDeleteRows(removing)
            setRemoving(null)
          }}
        />
      )}

      {onDeleteRows && (
        <ConfirmDialog
          open={confirming}
          title={deletingAll ? `Delete all ${noun(picked.size)}?` : `Delete ${noun(picked.size)}?`}
          description={deletingAll ? "Every row in the table will be removed. This can't be undone." : "This can't be undone."}
          confirmLabel={`Delete ${noun(picked.size)}`}
          typeToConfirm={deletingAll ? "delete" : undefined}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            onDeleteRows([...picked.values()])
            clearPicks()
            setConfirming(false)
          }}
        />
      )}
    </div>
  )
}

function HeaderCell<T>({
  column,
  sort,
  wrap,
  leftOffset,
  onSort,
}: {
  column: DataTableColumn<T>
  sort: { key: string; direction: "asc" | "desc" } | null
  wrap: boolean
  leftOffset: number
  onSort: () => void
}) {
  const active = sort?.key === column.key
  const SortIcon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown
  const align = column.align ?? "left"
  // One line for every header, subtitle included, so one can't make the header row taller than the rest.
  const label = (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-medium text-ui-heading">{column.header}</span>
      {column.subtitle && <span className="text-[11px] font-normal text-ui-caption">{column.subtitle}</span>}
    </span>
  )

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
      style={cellStyle(column as DataTableColumn<never>, leftOffset)}
      className={cn(
        "border-r border-b border-ui-border bg-ui-subtle px-4 py-2.5 align-middle text-xs last:border-r-0",
        wrap ? "px-3" : "whitespace-nowrap",
        alignClass[align],
        stickyClass(column as DataTableColumn<never>),
        column.sticky && "z-20"
      )}
    >
      {column.sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn("group/sort -mx-1 inline-flex w-[calc(100%+0.5rem)] items-center gap-1.5 rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong", justify[align])}
        >
          {label}
          <SortIcon
            className={cn("size-3.5 shrink-0 transition-colors", active ? "text-ui-heading" : "text-ui-hint group-hover/sort:text-ui-caption")}
            aria-hidden
          />
        </button>
      ) : (
        label
      )}
    </th>
  )
}
