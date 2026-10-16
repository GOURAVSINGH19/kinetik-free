"use client"

import { CalendarDays, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { panelClass, triggerClass, usePopover } from "./popover"
import type { DateRange } from "./types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const pad = (n: number) => String(n).padStart(2, "0")
/** A local date as YYYY-MM-DD, the format date inputs read and write. */
const iso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return iso(date)
}

const PRESETS = [
  { label: "Last 7 days", range: () => ({ from: daysAgo(6), to: daysAgo(0) }) },
  { label: "Last 30 days", range: () => ({ from: daysAgo(29), to: daysAgo(0) }) },
  { label: "Last 90 days", range: () => ({ from: daysAgo(89), to: daysAgo(0) }) },
]

/**
 * "30 Jan – 28 Feb", with years only when the range spans two. It never reads today's date, so it
 * renders the same on the server and in the browser.
 */
function describe(range: DateRange) {
  const spansYears = Boolean(range.from && range.to && range.from.slice(0, 4) !== range.to.slice(0, 4))
  // Spelled out by hand: toLocaleDateString differs between the server's locale and the visitor's.
  const format = (value: string) => {
    const [year, month, day] = value.split("-").map(Number)
    return `${day} ${MONTHS[month! - 1]}${spansYears ? ` ${year}` : ""}`
  }
  if (range.from && range.to) return `${format(range.from)} – ${format(range.to)}`
  if (range.from) return `From ${format(range.from)}`
  if (range.to) return `Until ${format(range.to)}`
  return null
}

const inputClass =
  "h-9 w-full rounded-md border border-ui-border bg-ui-bg px-2.5 text-sm text-ui-heading outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong [color-scheme:light] dark:[color-scheme:dark]"

/** A button showing the chosen dates, opening presets and a from / to pair of date inputs. */
export function DateRangePicker({ label = "Any date", value, onChange }: { label?: string; value: DateRange; onChange: (range: DateRange) => void }) {
  const { open, setOpen, rootRef, id } = usePopover()
  const summary = describe(value)

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={triggerClass(Boolean(summary))}>
        <CalendarDays className="size-4 text-ui-caption" aria-hidden />
        <span className="tabular-nums">{summary ?? label}</span>
      </button>

      {open && (
        <div id={id} role="group" aria-label="Date range" className={cn(panelClass, "right-0 w-64 gap-3 p-3")}>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.range())
                  setOpen(false)
                }}
                className="h-7 rounded-full border border-ui-border px-2.5 text-xs text-ui-secondary transition-colors hover:border-ui-border-strong hover:text-ui-heading"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-ui-caption">
              From
              <input type="date" value={value.from ?? ""} max={value.to} onChange={(e) => onChange({ ...value, from: e.target.value || undefined })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ui-caption">
              To
              <input type="date" value={value.to ?? ""} min={value.from} onChange={(e) => onChange({ ...value, to: e.target.value || undefined })} className={inputClass} />
            </label>
          </div>
          {summary && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-red-600 hover:underline dark:text-red-400"
            >
              <X className="size-3.5" aria-hidden />
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  )
}
