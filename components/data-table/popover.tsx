"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/** The toolbar's buttons: filters, dates and columns all share this look. */
export const triggerClass = (active: boolean) =>
  cn(
    "inline-flex h-9 items-center gap-1.5 rounded-md border bg-ui-bg px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong",
    active ? "border-ui-border-strong text-ui-heading" : "border-ui-border text-ui-secondary hover:text-ui-heading"
  )

export const panelClass = "absolute top-full z-30 mt-1 flex flex-col overflow-hidden rounded-md border border-ui-border bg-ui-bg shadow-lg"

/** Open state for a toolbar menu that closes on a click outside it or on Escape. */
export function usePopover() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", away)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", away)
      document.removeEventListener("keydown", escape)
    }
  }, [open])

  return { open, setOpen, rootRef, id }
}

/** The square checkbox drawn for a visually hidden native input. `mixed` draws a dash. */
export function Box({ checked, mixed = false }: { checked: boolean; mixed?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors",
        checked || mixed ? "border-ui-inverse bg-ui-inverse text-ui-on-inverse" : "border-ui-border-strong bg-ui-bg"
      )}
    >
      {mixed ? <span className="h-0.5 w-2 rounded-full bg-current" /> : checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  )
}
