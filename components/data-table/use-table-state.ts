import { useEffect, useMemo, useRef, useState } from "react"
import type { DataTableProps, DateRange, FilterValues, SortState } from "./types"

const SEARCH_DELAY = 300

const read = <T,>(row: T, key: string, columns: DataTableProps<T>["columns"]) => {
  const column = columns.find((c) => c.key === key)
  return column?.value ? column.value(row) : (row as Record<string, unknown>)[key]
}

/** Numbers sort as numbers, everything else as text, empty values last. */
const compare = (a: unknown, b: unknown) => {
  if (a == null || a === "") return 1
  if (b == null || b === "") return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" })
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * A cell value as a timestamp: Dates, epoch numbers and date strings all work. NaN when it isn't one.
 * A date-only string ("2026-01-15") is that day in local time, like the range bounds below;
 * Date.parse would read it as UTC midnight, a day early anywhere west of UTC.
 */
const timeOf = (value: unknown) =>
  value instanceof Date ? value.getTime()
    : typeof value === "number" ? value
      : typeof value === "string" ? (DATE_ONLY.test(value) ? new Date(`${value}T00:00:00`).getTime() : Date.parse(value))
        : Number.NaN

/** The range's ends in local time, `to` covering its whole day. */
const bounds = (range: DateRange) => ({
  from: range.from ? new Date(`${range.from}T00:00:00`).getTime() : -Infinity,
  to: range.to ? new Date(`${range.to}T23:59:59.999`).getTime() : Infinity,
})

/** Search, tab, filter, date, sort and page state, and the rows to show for it. */
export function useTableState<T>(props: DataTableProps<T>) {
  const { data, columns, manual = false } = props

  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<string | null>(props.defaultTab ?? null)
  const [dateRange, setDateRange] = useState<DateRange>(props.defaultDateRange ?? {})
  const [pageSize, setPageSize] = useState(props.pageSize ?? 10)
  const [filterValues, setFilterValues] = useState<FilterValues>(props.defaultFilterValues ?? {})
  const [ownSort, setOwnSort] = useState<SortState | null>(props.defaultSort ?? null)
  const [ownPage, setOwnPage] = useState(1)
  const sort = props.sort !== undefined ? props.sort : ownSort

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  const rows = useMemo(() => {
    if (manual) return data
    let result = data
    if (props.tabs && tab !== null) {
      const tabKey = props.tabs.key
      result = result.filter((row) => String(read(row, tabKey, columns) ?? "").toLowerCase() === tab.toLowerCase())
    }
    if (props.dateRange && (dateRange.from || dateRange.to)) {
      const dateKey = props.dateRange.key
      const { from, to } = bounds(dateRange)
      result = result.filter((row) => {
        const time = timeOf(read(row, dateKey, columns))
        return time >= from && time <= to
      })
    }
    for (const [key, values] of Object.entries(filterValues)) {
      if (!values?.length) continue
      const wanted = new Set(values.map((v) => v.toLowerCase()))
      result = result.filter((row) => wanted.has(String(read(row, key, columns) ?? "").toLowerCase()))
    }
    const q = query.trim().toLowerCase()
    if (props.searchable && q) {
      const keys = props.searchKeys ?? columns.map((c) => c.key)
      result = result.filter((row) => keys.some((key) => String(read(row, key, columns) ?? "").toLowerCase().includes(q)))
    }
    if (sort) {
      const sign = sort.direction === "asc" ? 1 : -1
      result = [...result].sort((a, b) => sign * compare(read(a, sort.key, columns), read(b, sort.key, columns)))
    }
    return result
  }, [data, columns, manual, tab, dateRange, filterValues, query, sort, props.tabs, props.dateRange, props.searchable, props.searchKeys])

  const pageCount = Math.max(1, manual ? (props.pageCount ?? 1) : Math.ceil(rows.length / pageSize))
  // Clamped, so the page stays valid when the data or filters shrink the list.
  const page = Math.min(Math.max(1, props.page ?? ownPage), pageCount)
  const visible = manual ? rows : rows.slice((page - 1) * pageSize, page * pageSize)

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(1, next), pageCount)
    if (props.page === undefined) setOwnPage(clamped)
    props.onPageChange?.(clamped)
  }
  // Any change to what's shown starts again from the first page.
  const restart = () => {
    if (props.page === undefined) setOwnPage(1)
    else if (props.page !== 1) props.onPageChange?.(1)
  }

  const search = (next: string) => {
    setQuery(next)
    restart()
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!props.onSearchChange) return
    // Clearing is sent at once; typing waits until it pauses.
    if (next === "") props.onSearchChange("")
    else searchTimer.current = setTimeout(() => props.onSearchChange?.(next), SEARCH_DELAY)
  }

  const filter = (key: string, values: string[]) => {
    const next = { ...filterValues, [key]: values }
    setFilterValues(next)
    restart()
    props.onFiltersChange?.(next)
  }

  const selectTab = (next: string | null) => {
    setTab(next)
    restart()
    props.onTabChange?.(next)
  }

  const selectDates = (next: DateRange) => {
    setDateRange(next)
    restart()
    props.onDateRangeChange?.(next)
  }

  const resize = (next: number) => {
    setPageSize(next)
    restart()
    props.onPageSizeChange?.(next)
  }

  // Each click on a sortable header goes ascending, then descending, then unsorted.
  const toggleSort = (key: string) => {
    const next: SortState | null =
      sort?.key !== key ? { key, direction: "asc" } : sort.direction === "asc" ? { key, direction: "desc" } : null
    if (props.sort === undefined) setOwnSort(next)
    restart()
    props.onSortChange?.(next)
  }

  return {
    query, search, tab, selectTab, dateRange, selectDates, filterValues, filter, sort, toggleSort,
    page, pageCount, pageSize, resize, goTo, visible, total: rows.length,
  }
}
