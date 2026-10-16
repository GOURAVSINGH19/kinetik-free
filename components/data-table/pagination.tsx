"use client"

import { useId, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/button/button"

/**
 * Page numbers around the current one, with the first and last always shown and gaps marked.
 * Because 1 and the last page are always a click away, there are no separate « » buttons.
 */
function pagesAround(page: number, count: number): Array<number | "gap"> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const start = Math.max(2, Math.min(page - 1, count - 4))
  const end = Math.min(count - 1, Math.max(page + 1, 5))
  return [1, ...(start > 2 ? ["gap" as const] : []), ...Array.from({ length: end - start + 1 }, (_, i) => start + i), ...(end < count - 1 ? ["gap" as const] : []), count]
}

/** Page numbers grow past two digits instead of clipping inside the round icon button. */
const pageCell = "w-auto min-w-8 px-2 text-sm tabular-nums"

export function Pagination({
  page,
  pageCount,
  onChange,
  summary,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  summary?: string
  pageSize?: number
  /** Show a rows-per-page picker with these sizes. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}) {
  const [jump, setJump] = useState("")
  const jumpId = useId()
  const sizeId = useId()
  const go = () => {
    const n = Number.parseInt(jump, 10)
    if (Number.isFinite(n)) onChange(n)
    setJump("")
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-ui-border px-3 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ui-caption">
        <p className="tabular-nums">{summary}</p>
        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor={sizeId}>Rows per page</label>
            <span className="relative">
              <select
                id={sizeId}
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="h-8 cursor-pointer appearance-none rounded-full border border-ui-border bg-ui-bg pr-7 pl-3 text-sm text-ui-heading tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ui-caption" aria-hidden />
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
          <ChevronLeft aria-hidden />
        </Button>
        {pagesAround(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-sm text-ui-hint">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={pageCell}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Next page">
          <ChevronRight aria-hidden />
        </Button>
      </div>

      {pageCount > 7 && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            go()
          }}
          className="flex items-center gap-2 text-xs text-ui-caption"
        >
          <label htmlFor={jumpId}>Go to page</label>
          <input
            id={jumpId}
            type="number"
            inputMode="numeric"
            min={1}
            max={pageCount}
            value={jump}
            onChange={(event) => setJump(event.target.value)}
            className="h-8 w-16 rounded-full border border-ui-border bg-ui-bg px-3 text-center text-sm text-ui-heading outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button type="submit" variant="outline">
            Go
          </Button>
        </form>
      )}
    </nav>
  )
}
