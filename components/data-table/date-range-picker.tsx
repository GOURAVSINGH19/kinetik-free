"use client"

import { useState } from "react"
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react"
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
  { label: "Today", range: () => ({ from: daysAgo(0), to: daysAgo(0) }) },
  { label: "Yesterday", range: () => ({ from: daysAgo(1), to: daysAgo(1) }) },
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

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/** A month as weeks of 7 cells, Monday first; null pads the days outside the month. */
function weeksOf(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, d) => iso(new Date(year, month, d + 1)))]
  while (cells.length % 7) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}

/** A button showing the chosen dates, opening presets and a month calendar where two clicks pick a range. */
export function DateRangePicker({ label = "Any date", value, onChange }: { label?: string; value: DateRange; onChange: (range: DateRange) => void }) {
  const { open, setOpen, rootRef, id } = usePopover()
  const summary = describe(value)
  // Today is read when the menu opens, never during render, so the server and browser render alike.
  const [today, setToday] = useState("")
  const [view, setView] = useState({ year: 1970, month: 0 })
  const toggle = () => {
    if (!open) {
      const now = iso(new Date())
      const [y, m] = (value.from ?? value.to ?? now).split("-").map(Number)
      setToday(now)
      setView({ year: y!, month: m! - 1 })
    }
    setOpen((o) => !o)
  }
  // The first click of a pair sets `from` alone; the second completes the range.
  const [picking, setPicking] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  // The preset that matches the chosen dates, if any. Computed only while the menu is open.
  const activePreset = open && value.from && value.to ? PRESETS.find((p) => { const r = p.range(); return r.from === value.from && r.to === value.to }) : undefined
  const [hover, setHover] = useState<string | null>(null)

  const shift = (by: number) => {
    const date = new Date(view.year, view.month + by, 1)
    setView({ year: date.getFullYear(), month: date.getMonth() })
  }
  const pick = (day: string) => {
    if (!picking || !value.from) {
      onChange({ from: day })
      setPicking(true)
      return
    }
    onChange(day < value.from ? { from: day, to: value.from } : { from: value.from, to: day })
    setPicking(false)
    setOpen(false)
  }
  const end = picking && value.from ? (hover ?? value.from) : value.to
  const [lo, hi] = value.from && end ? (end < value.from ? [end, value.from] : [value.from, end]) : [value.from, value.to]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={summary ?? label}
        onClick={toggle}
        className={cn(triggerClass(Boolean(summary)), "max-sm:w-9 max-sm:justify-center max-sm:px-0")}
      >
        <CalendarDays className="size-4 shrink-0 text-ui-caption" aria-hidden />
        <span className="tabular-nums max-sm:hidden">{summary ?? label}</span>
      </button>

      {open && (
        <div id={id} role="group" aria-label="Date range" className={cn(panelClass, "right-0 w-[19rem] max-w-[calc(100vw-2rem)] p-3")}>
          <div className="pb-3">
            <button
              type="button"
              aria-expanded={presetsOpen}
              onClick={() => setPresetsOpen((o) => !o)}
              className="flex h-9 w-full items-center justify-between rounded-md border border-ui-border bg-ui-bg px-3 text-sm text-ui-heading outline-none transition-colors hover:border-ui-border-strong focus-visible:ring-2 focus-visible:ring-ui-border-strong"
            >
              <span className={cn(!activePreset && "text-ui-caption")}>{activePreset?.label ?? "Quick select"}</span>
              <ChevronDown className={cn("size-4 text-ui-caption transition-transform duration-200", presetsOpen && "rotate-180")} aria-hidden />
            </button>
            {presetsOpen && (
              <ul role="listbox" aria-label="Quick select" className="mt-1 overflow-hidden rounded-md border border-ui-border py-1">
                {PRESETS.map((preset) => {
                  const active = preset === activePreset
                  return (
                    <li key={preset.label} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => {
                          const range = preset.range()
                          onChange(range)
                          setPicking(false)
                          setView({ year: Number(range.to!.slice(0, 4)), month: Number(range.to!.slice(5, 7)) - 1 })
                          setPresetsOpen(false)
                          setOpen(false)
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-1.5 text-sm outline-none transition-colors hover:bg-ui-subtle focus-visible:bg-ui-subtle",
                          active ? "font-medium text-ui-heading" : "text-ui-body"
                        )}
                      >
                        {preset.label}
                        {active && <Check className="size-3.5" aria-hidden />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-ui-border pt-3 pb-2">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="grid size-7 place-items-center rounded-md text-ui-secondary hover:bg-ui-subtle hover:text-ui-heading">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="text-sm font-medium text-ui-heading">
              {MONTH_NAMES[view.month]} {view.year}
            </span>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid size-7 place-items-center rounded-md text-ui-secondary hover:bg-ui-subtle hover:text-ui-heading">
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] text-ui-caption">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div onMouseLeave={() => setHover(null)}>
            {weeksOf(view.year, view.month).map((week, w) => (
              <div key={w} className="grid grid-cols-7">
                {week.map((day, d) => {
                  if (!day) return <span key={d} />
                  const edge = day === lo || day === hi
                  const inside = Boolean(lo && hi && day > lo && day < hi)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => pick(day)}
                      onMouseEnter={() => setHover(day)}
                      aria-pressed={edge}
                      aria-label={day}
                      className={cn(
                        "h-8 text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ui-border-strong",
                        inside && "bg-ui-muted text-ui-heading",
                        edge ? "rounded-md bg-ui-inverse font-medium text-ui-on-inverse" : !inside && "rounded-md text-ui-body hover:bg-ui-subtle",
                        day === today && !edge && "font-semibold text-ui-heading underline underline-offset-4"
                      )}
                    >
                      {Number(day.slice(8))}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {summary && (
            <button
              type="button"
              onClick={() => {
                onChange({})
                setPicking(false)
              }}
              className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-red-600 hover:underline dark:text-red-400"
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
