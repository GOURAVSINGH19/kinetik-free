import type { ReactNode } from "react"

export type SortDirection = "asc" | "desc"
export interface SortState {
  key: string
  direction: SortDirection
}

/** Selected values per filter key. An empty or missing list means no filtering on that key. */
export type FilterValues = Record<string, string[]>

export interface DataTableColumn<T> {
  /** Field name on the row; also the column's id. */
  key: string
  header: ReactNode
  /** Muted text beside the header, e.g. a unit or period ("last 30 days"). */
  subtitle?: ReactNode
  align?: "left" | "center" | "right"
  /** Minimum width, e.g. 160 or "12rem". */
  minWidth?: number | string
  /** Shows a sort control on the header. */
  sortable?: boolean
  /** Keeps the column in view while the table scrolls sideways. */
  sticky?: "left" | "right"
  /** Custom cell. Defaults to the value of `row[key]`. */
  cell?: (row: T) => ReactNode
  /** The value used to sort and search. Defaults to `row[key]`. */
  value?: (row: T) => unknown
  className?: string
}

/** A from–to range of `YYYY-MM-DD` dates. Either end may be open. */
export interface DateRange {
  from?: string
  to?: string
}

export type DataTableOption = string | { label: string; value: string }

/** Tabs above the table that show one value of a field at a time, plus "All". */
export interface DataTableTabs {
  /** Field name the tabs match on. */
  key: string
  options: DataTableOption[]
  /** Label of the tab that shows every row. */
  allLabel?: string
}

export interface DataTableFilter {
  /** Field name the filter matches on. */
  key: string
  label: string
  options: DataTableOption[]
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  /** A stable key per row. Defaults to the row's index. */
  rowKey?: (row: T, index: number) => string | number
  title?: ReactNode
  description?: ReactNode

  /** Show a search box. Matches every column's value unless `searchKeys` narrows it. */
  searchable?: boolean
  searchKeys?: string[]
  searchPlaceholder?: string
  /** Called 300ms after typing stops, e.g. to search on the server. */
  onSearchChange?: (query: string) => void

  filters?: DataTableFilter[]
  defaultFilterValues?: FilterValues
  onFiltersChange?: (values: FilterValues) => void

  /** Tabs above the table, one per value of a field (e.g. status). */
  tabs?: DataTableTabs
  defaultTab?: string
  onTabChange?: (value: string | null) => void

  /** A date range picker that keeps rows whose `key` falls inside it. Values are dates or ISO strings. */
  dateRange?: { key: string; label?: string }
  defaultDateRange?: DateRange
  onDateRangeChange?: (range: DateRange) => void

  /** A checkbox per row and one in the header for the page. Pass `rowKey` so picks survive paging. */
  selectable?: boolean
  onSelectionChange?: (keys: Array<string | number>, rows: T[]) => void
  /**
   * Shows Delete in the bar that appears while rows are picked. It asks first, and deleting every
   * row asks you to type "delete". Remove the rows from `data` here.
   */
  onDeleteRows?: (rows: T[]) => void
  /** More buttons for that bar, e.g. Export. `clear` empties the selection. */
  bulkActions?: (rows: T[], clear: () => void) => ReactNode
  /** What a row is called in messages, singular and plural, e.g. ["service", "services"]. */
  rowNoun?: [string, string]

  /** A menu that shows and hides columns. Pinned columns always stay. */
  columnToggle?: boolean
  /** Keys of columns hidden at first. */
  defaultHiddenColumns?: string[]

  /** Controlled sort. Leave unset to let the table sort by itself. */
  sort?: SortState | null
  defaultSort?: SortState | null
  onSortChange?: (sort: SortState | null) => void

  pageSize?: number
  /** Show a rows-per-page picker with these sizes, e.g. [10, 25, 50]. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  /** Controlled page (1-based). */
  page?: number
  onPageChange?: (page: number) => void

  /**
   * Your server already filtered, searched, sorted and paged `data`: show it as it is.
   * Pass `pageCount`, and handle the change callbacks to fetch.
   */
  manual?: boolean
  pageCount?: number

  loading?: boolean
  /** Shown in place of the rows. */
  error?: ReactNode
  emptyMessage?: ReactNode
  /** Skeleton rows while loading. */
  loadingRows?: number
  /**
   * Keep columns at their full width and scroll sideways when they don't fit. Off, the table
   * fits its container and long text wraps instead.
   */
  scrollable?: boolean
  className?: string
}
