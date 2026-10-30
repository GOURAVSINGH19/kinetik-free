"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Clock, History as HistoryIcon, Search, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { SPRING, type QuickChatSession } from "./types"

type Range = "all" | "today" | "7d" | "30d"

const RANGES: { id: Range; label: string }[] = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
]

const DAY = 24 * 60 * 60 * 1000
const startOfDay = (t: number) => new Date(new Date(t).setHours(0, 0, 0, 0)).getTime()

function dayLabel(t: number, now: number) {
  const diff = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  return new Intl.DateTimeFormat(undefined, {
    weekday: diff < 7 ? "long" : undefined,
    month: "short",
    day: "numeric",
    year: new Date(t).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
  }).format(t)
}

/** "Oct 26, 2026 · 2:30 AM": the full date and time, so chats with similar names are easy to tell apart. */
const stampOf = (t: number) =>
  `${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(t)} · ${new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(t)}`
const fullDate = (t: number) => new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(t)

/** Wraps each case-insensitive match of `query` in a highlight. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <mark key={i} className="rounded-[3px] bg-ui-accent/25 px-0.5 text-ui-heading">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

/** The line under a chat's title: the latest reply, or where a search matched. */
function previewOf(session: QuickChatSession, query: string) {
  const texts = session.messages.map((m) => m.text).filter(Boolean)
  if (query) {
    // Skip the first message: it's the title, already on the line above.
    const hit = texts.slice(1).find((t) => t.toLowerCase().includes(query.toLowerCase()))
    if (hit) {
      const at = hit.toLowerCase().indexOf(query.toLowerCase())
      return (at > 40 ? "…" : "") + hit.slice(Math.max(0, at - 40), at + 120)
    }
  }
  return [...session.messages].reverse().find((m) => m.role === "assistant" && m.text)?.text ?? texts.at(-1) ?? ""
}

/**
 * Past chats, newest first and grouped by day, each with its full date and time. A search box
 * and quick date ranges narrow the list.
 * Picking one reopens it; the bin deletes it.
 */
export function HistoryView({
  sessions,
  activeId,
  onOpen,
  onDelete,
}: {
  sessions: QuickChatSession[]
  activeId: string | null
  onOpen: (session: QuickChatSession) => void
  onDelete: (id: string) => void
}) {
  const reduce = useReducedMotion()
  const [query, setQuery] = useState("")
  const [range, setRange] = useState<Range>("all")
  const now = Date.now()
  const q = query.trim()

  const filtered = useMemo(() => {
    const from = range === "today" ? startOfDay(now) : range === "7d" ? now - 7 * DAY : range === "30d" ? now - 30 * DAY : 0
    return sessions.filter((s) => {
      if (s.createdAt < from) return false
      if (!q) return true
      const needle = q.toLowerCase()
      return s.title.toLowerCase().includes(needle) || s.messages.some((m) => m.text.toLowerCase().includes(needle))
    })
    // `now` changes every render; the day boundaries it feeds only matter at the minute scale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, q, range])

  const groups = useMemo(() => {
    const map = new Map<string, QuickChatSession[]>()
    for (const s of filtered) {
      const label = dayLabel(s.createdAt, now)
      map.set(label, [...(map.get(label) ?? []), s])
    }
    return [...map.entries()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  const filtering = Boolean(q || range !== "all")
  const clear = () => {
    setQuery("")
    setRange("all")
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={SPRING}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-ui-border px-3 py-3">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-ui-border bg-ui-subtle px-2.5 focus-within:border-ui-border-strong">
          <Search aria-hidden className="size-3.5 text-ui-hint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            aria-label="Search chats"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ui-heading outline-none placeholder:text-ui-hint"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="text-ui-hint hover:text-ui-heading">
              <X className="size-3.5" />
            </button>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <div role="radiogroup" aria-label="When" className="flex flex-wrap gap-1">
            {RANGES.map((r) => {
              const on = range === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setRange(r.id)}
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-[12px] transition-colors",
                    on
                      ? "border-transparent bg-ui-inverse text-ui-on-inverse"
                      : "border-ui-border text-ui-secondary hover:border-ui-border-strong hover:text-ui-heading",
                  )}
                >
                  {r.label}
                </button>
              )
            })}
          </div>

        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-ui-muted text-ui-caption">
              <HistoryIcon className="size-4" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-ui-heading">{filtering ? "No chats match" : "No chats yet"}</p>
            <p className="mt-1 text-[12px] text-ui-caption">
              {filtering ? "Try another word or a wider date range." : "Your conversations will show up here."}
            </p>
            {filtering && (
              <button type="button" onClick={clear} className="mt-3 text-[12px] text-ui-secondary underline underline-offset-2 hover:text-ui-heading">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          groups.map(([label, items]) => (
            <section key={label} aria-label={label} className="mb-2">
              <h3 className="px-2 pt-2 pb-1 text-[11.5px] font-medium text-ui-hint">{label}</h3>
              <ul>
                <AnimatePresence initial={false}>
                  {items.map((s) => (
                    <motion.li
                      key={s.id}
                      layout={!reduce}
                      initial={false}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SPRING}
                      className="group relative"
                    >
                      <button
                        type="button"
                        onClick={() => onOpen(s)}
                        aria-current={s.id === activeId ? "true" : undefined}
                        className={cn(
                          "flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 pr-9 text-left transition-colors",
                          s.id === activeId ? "bg-ui-muted" : "hover:bg-ui-muted",
                        )}
                      >
                        <span className="w-full truncate text-[13px] font-medium text-ui-heading">
                          <Highlight text={s.title} query={q} />
                        </span>
                        <span className="line-clamp-1 text-[12px] text-ui-caption">
                          <Highlight text={previewOf(s, q)} query={q} />
                        </span>
                        <time
                          dateTime={new Date(s.createdAt).toISOString()}
                          title={fullDate(s.createdAt)}
                          className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ui-hint tabular-nums"
                        >
                          <Clock aria-hidden className="size-3" />
                          {stampOf(s.createdAt)}
                        </time>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete “${s.title}”`}
                        onClick={() => onDelete(s.id)}
                        className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ui-hint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-ui-emphasis hover:text-rose-500 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))
        )}
      </div>
    </motion.div>
  )
}
