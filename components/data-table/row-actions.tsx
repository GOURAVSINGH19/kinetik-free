"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MoreHorizontal } from "lucide-react"
import { MenuPanel } from "@/components/menubar/menu-panel"
import type { MenubarEntry } from "@/components/menubar/index"
import { cn } from "@/lib/utils"

/** A row action: the same entries the Menubar takes (items, submenus, labels, separators). */
export type RowAction = MenubarEntry

/** Room the menu needs below its button before it opens upwards instead. */
const FLIP_AT = 280

/**
 * The ⋯ button for a row, opening the Menubar's menu panel. The panel is portalled to the body
 * and fixed to the button, so the table's scroll box can't clip it; scrolling or resizing closes it.
 */
export function RowActions({ items, label = "Row actions", className }: { items: RowAction[]; label?: string; className?: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // Mounted on first open and kept, so closing can play the panel's fade-out.
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState(0)
  const [focusKey, setFocusKey] = useState(0)
  const [place, setPlace] = useState<{ top: number; left: number; up: boolean }>({ top: 0, left: 0, up: false })

  const show = (fromKeyboard: boolean) => {
    const box = triggerRef.current?.getBoundingClientRect()
    if (!box) return
    const up = box.bottom + FLIP_AT > window.innerHeight && box.top > FLIP_AT
    setPlace({ top: up ? box.top - 6 : box.bottom + 6, left: box.right, up })
    setMounted(true)
    setSession((s) => s + 1)
    setFocusKey(fromKeyboard ? Date.now() : 0)
    setOpen(true)
  }

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  // A click elsewhere, a scroll or a resize closes it: a fixed menu would drift from its row.
  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      const target = event.target as Node
      if (!anchorRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false)
    }
    const drop = () => setOpen(false)
    document.addEventListener("pointerdown", away)
    window.addEventListener("scroll", drop, true)
    window.addEventListener("resize", drop)
    return () => {
      document.removeEventListener("pointerdown", away)
      window.removeEventListener("scroll", drop, true)
      window.removeEventListener("resize", drop)
    }
  }, [open])

  // The panel grows out of the button's corner, like the Menubar's grows out of its trigger.
  useLayoutEffect(() => {
    const panel = anchorRef.current?.firstElementChild as HTMLElement | null
    if (panel) panel.style.transformOrigin = place.up ? "100% 100%" : "100% 0"
  }, [place, mounted])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : show(false))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            show(true)
          }
        }}
        className={cn(
          "inline-grid size-7 cursor-pointer place-items-center rounded-md text-ui-caption transition-colors outline-none hover:bg-ui-muted hover:text-ui-heading focus-visible:ring-2 focus-visible:ring-ui-border-strong aria-expanded:bg-ui-muted aria-expanded:text-ui-heading",
          className
        )}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {mounted &&
        createPortal(
          <div ref={anchorRef} className="fixed z-50 size-0" style={{ top: place.top, left: place.left }}>
            <MenuPanel
              entries={items}
              open={open}
              session={session}
              focusKey={focusKey}
              label={label}
              onClose={(reason) => close(reason === "back")}
              className={cn("right-0", place.up ? "bottom-0" : "top-0")}
            />
          </div>,
          document.body
        )}
    </>
  )
}
