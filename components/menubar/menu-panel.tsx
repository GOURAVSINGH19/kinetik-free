"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { MOTION, type MenubarEntry } from "./types"

interface MenuPanelProps {
  entries: MenubarEntry[]
  open: boolean
  /** Changes every time a menu opens, so a submenu left open last time starts closed. */
  session: number
  /** Changes when the panel was opened from the keyboard: focus its first item. */
  focusKey: number
  label: string
  submenu?: boolean
  /** `select` closes everything; `back` returns to the trigger that opened this panel. */
  onClose: (reason: "select" | "back") => void
  /** Left / Right from a top-level menu moves to the neighbouring menu. */
  onNavigate?: (step: 1 | -1) => void
  className?: string
}

/** This panel's own enabled items, not those of a submenu inside it. */
const ITEMS = ":scope > [data-row] > [data-menu-item]:not(:disabled)"

const Chevron = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="ms-auto size-3.5 text-ui-hint">
    <path d="m6 4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Check = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden className={cn("size-4 transition-opacity", on ? "opacity-100" : "opacity-0")}>
    <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function MenuPanel({ entries, open, session, focusKey, label, submenu = false, onClose, onNavigate, className }: MenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)
  const [sub, setSub] = useState<{ index: number; session: number; focusKey: number } | null>(null)
  const openSub = sub && sub.session === session ? sub.index : -1

  const items = () => [...(panelRef.current?.querySelectorAll<HTMLButtonElement>(ITEMS) ?? [])]
  const itemAt = (index: number) => panelRef.current?.querySelector<HTMLButtonElement>(`:scope > [data-row] > [data-index="${index}"]`)

  // A soft highlight glides to whichever item is hovered or focused.
  const glide = (item: HTMLElement | null) => {
    const glow = glowRef.current
    const panel = panelRef.current
    if (!glow || !panel) return
    if (!item) {
      glow.style.opacity = "0"
      return
    }
    // Layout offsets, not screen boxes, so the highlight still lands right when the menu is scaled
    // (a zoomed or transformed parent). Each item sits in its own row, positioned inside the panel.
    const top = (item.parentElement as HTMLElement).offsetTop
    glow.style.transform = `translateY(${top}px)`
    glow.style.height = `${item.offsetHeight}px`
    glow.style.opacity = "1"
  }

  useEffect(() => {
    if (open && focusKey > 0) panelRef.current?.querySelector<HTMLButtonElement>(ITEMS)?.focus()
  }, [open, focusKey])

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, entry: MenubarEntry, index: number) => {
    const list = items()
    const at = list.indexOf(event.currentTarget)
    const move = (to: number) => list[(to + list.length) % list.length]?.focus()
    if (event.key === "ArrowDown") move(at + 1)
    else if (event.key === "ArrowUp") move(at - 1)
    else if (event.key === "Home") move(0)
    else if (event.key === "End") move(list.length - 1)
    else if (event.key === "ArrowRight" && entry.type === "submenu") setSub({ index, session, focusKey: Date.now() })
    else if (event.key === "Escape" || (event.key === "ArrowLeft" && submenu)) onClose("back")
    else if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && onNavigate) onNavigate(event.key === "ArrowRight" ? 1 : -1)
    else return
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label={label}
      inert={!open}
      onPointerLeave={() => glide(null)}
      className={cn(
        "absolute z-50 min-w-56 rounded-xl border border-ui-border bg-ui-bg p-1 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.18),0_2px_6px_-2px_rgb(0_0_0/0.08)] transition-[opacity,scale,filter]",
        MOTION,
        open ? "scale-100 opacity-100 blur-none" : "pointer-events-none scale-95 opacity-0 blur-[2px]",
        className
      )}
    >
      <span ref={glowRef} aria-hidden className={cn("pointer-events-none absolute inset-x-1 top-0 rounded-lg bg-ui-muted opacity-0 transition-[transform,height,opacity]", MOTION)} />
      {entries.map((entry, index) => {
        if (entry.type === "separator") return <div key={index} role="separator" className="mx-2 my-1 h-px bg-ui-border" />
        if (entry.type === "label") return <div key={index} className="px-2.5 pt-1.5 pb-1 text-xs text-ui-hint">{entry.label}</div>
        const isSub = entry.type === "submenu"
        const isCheck = entry.type === "checkbox"
        const destructive = (entry.type === undefined || entry.type === "item") && entry.destructive
        return (
          <div key={index} data-row className="relative">
            <button
              type="button"
              data-menu-item
              data-index={index}
              role={isCheck ? "menuitemcheckbox" : "menuitem"}
              aria-checked={isCheck ? entry.checked : undefined}
              aria-haspopup={isSub ? "menu" : undefined}
              aria-expanded={isSub ? openSub === index : undefined}
              disabled={entry.type === undefined || entry.type === "item" ? entry.disabled : undefined}
              onPointerEnter={(event) => {
                glide(event.currentTarget)
                setSub(isSub ? { index, session, focusKey: 0 } : null)
              }}
              onFocus={(event) => glide(event.currentTarget)}
              onKeyDown={(event) => onKeyDown(event, entry, index)}
              onClick={() => {
                if (isSub) return setSub({ index, session, focusKey: Date.now() })
                if (isCheck) return entry.onCheckedChange(!entry.checked)
                entry.onSelect?.()
                onClose("select")
              }}
              className={cn(
                "relative z-10 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-ui-heading outline-none disabled:cursor-default disabled:opacity-45 [&_svg]:shrink-0",
                destructive && "text-red-600 dark:text-red-400"
              )}
            >
              {isCheck ? (
                <Check on={entry.checked} />
              ) : (
                entry.icon && <span className={cn("flex [&_svg]:size-4", destructive ? "text-current" : "text-ui-caption")}>{entry.icon}</span>
              )}
              <span className="truncate">{entry.label}</span>
              {!isSub && "shortcut" in entry && entry.shortcut && (
                <kbd className="ms-auto ps-4 font-mono text-[11px] text-ui-hint">{entry.shortcut}</kbd>
              )}
              {isSub && <Chevron />}
            </button>
            {isSub && (
              <MenuPanel
                entries={entry.items}
                open={open && openSub === index}
                session={session}
                focusKey={openSub === index ? (sub?.focusKey ?? 0) : 0}
                label={entry.label}
                submenu
                onClose={(reason) => {
                  setSub(null)
                  if (reason === "select") onClose("select")
                  else itemAt(index)?.focus()
                }}
                className="-top-1 left-full ms-1.5 origin-top-left"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
