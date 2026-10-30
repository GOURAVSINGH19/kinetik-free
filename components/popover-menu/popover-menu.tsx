"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState, type RefObject } from "react"
import { cn } from "@/lib/utils"

export const POP = { type: "spring", stiffness: 560, damping: 34, mass: 0.6 } as const

/**
 * Closes on a pointer down outside `ref` (and outside `ignore`, usually the trigger), and on
 * Escape wherever focus is. Escape is caught on the document in the capture phase, so the
 * open menu gets it first and an outer Escape-to-close (a dialog, a panel) never sees it.
 */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
  ignore?: RefObject<HTMLElement | null>,
) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (ref.current?.contains(target) || ignore?.current?.contains(target)) return
      close.current()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      event.preventDefault()
      close.current()
      if (ref.current?.contains(document.activeElement)) ignore?.current?.focus()
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open, ref, ignore])
}

/**
 * A small floating card above (or below) its nearest `relative` ancestor. Closes on Escape
 * and on a click outside. Put `data-autofocus` on the element that should take focus when it
 * opens; leave it off to keep focus where it is (for example in a textarea).
 */
export function PopoverMenu({
  open,
  onClose,
  anchorRef,
  side = "top",
  align = "start",
  label,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  /** The trigger: clicks on it don't count as outside, and focus returns to it on Escape. */
  anchorRef?: RefObject<HTMLElement | null>
  side?: "top" | "bottom"
  align?: "start" | "end"
  label: string
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  useDismiss(open, onClose, ref, anchorRef)

  // React's autoFocus only covers form controls, hence data-autofocus. The menu is mounted by
  // the time effects run, so focus goes straight in (no frame wait, which stalls in background tabs).
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true })
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-label={label}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: side === "top" ? 6 : -6, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4, filter: "blur(2px)" }}
          transition={POP}
          style={{ transformOrigin: `${side === "top" ? "bottom" : "top"} ${align === "start" ? "left" : "right"}` }}
          className={cn(
            "absolute z-30 w-72 overflow-hidden rounded-xl border border-ui-border bg-ui-bg p-1 text-[13px] shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35)]",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "start" ? "left-0" : "right-0",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-2 pb-1 text-[11.5px] text-ui-hint">{children}</div>
}

/** A row in a list menu. `active` is the keyboard highlight, which also follows the pointer. */
export function MenuRow({
  active,
  onSelect,
  onHover,
  icon,
  title,
  hint,
  trailing,
  inline,
}: {
  active?: boolean
  onSelect: () => void
  onHover?: () => void
  icon?: React.ReactNode
  title: React.ReactNode
  hint?: React.ReactNode
  trailing?: React.ReactNode
  /** Puts the hint at the end of the line instead of under the title. */
  inline?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" })
  }, [active])

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onClick={onSelect}
      onPointerMove={onHover}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-ui-heading outline-none",
        active ? "bg-ui-muted" : "hover:bg-ui-muted",
      )}
    >
      {icon}
      <span className={cn("min-w-0 flex-1", inline ? "flex items-baseline justify-between gap-3" : "flex flex-col")}>
        <span className="truncate">{title}</span>
        {hint && <span className={cn("truncate text-[12px] text-ui-caption", !inline && "leading-4")}>{hint}</span>}
      </span>
      {trailing}
    </button>
  )
}

/** Arrow-key highlight for a list whose focus stays elsewhere (a search box or a textarea). */
export function useListNav(count: number, onPick: (index: number) => void, resetKey?: unknown) {
  const [active, setActive] = useState(0)
  useEffect(() => setActive(0), [resetKey, count])

  /** Returns true when it handled the key, so the caller can skip its own handling. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!count) return false
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setActive((i) => (i + (event.key === "ArrowDown" ? 1 : count - 1)) % count)
      return true
    }
    if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
      event.preventDefault()
      onPick(Math.min(active, count - 1))
      return true
    }
    return false
  }

  return { active, setActive, onKeyDown }
}
