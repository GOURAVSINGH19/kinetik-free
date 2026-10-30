"use client"

import { useEffect, useRef, useState } from "react"
import { Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"

const LEAVE_MS = 220

export interface UndoToastProps {
  message: string
  /** How long Undo stays on offer, in ms. */
  duration?: number
  /** Undo was pressed. */
  onUndo: () => void
  /** The time ran out or it was dismissed: the delete stands. */
  onDone: () => void
}

/**
 * A small blurred card that slides in from the right with an Undo button and a draining bar.
 * Mount it when something is deleted and unmount it from either callback.
 */
export function UndoToast({ message, duration = 6000, onUndo, onDone }: UndoToastProps) {
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState<"undo" | "done" | null>(null)
  const latest = useRef({ onUndo, onDone })
  latest.current = { onUndo, onDone }

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    const timer = setTimeout(() => setLeaving((l) => l ?? "done"), duration)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [duration])

  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => (leaving === "undo" ? latest.current.onUndo() : latest.current.onDone()), LEAVE_MS)
    return () => clearTimeout(timer)
  }, [leaving])

  const shown = entered && !leaving

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "absolute top-3 right-3 z-40 overflow-hidden rounded-full border border-ui-border bg-ui-bg/70 shadow-lg backdrop-blur-xl transition-[transform,opacity] ease-out supports-[backdrop-filter]:bg-ui-bg/60",
        shown ? "translate-x-0 opacity-100 duration-300" : "translate-x-6 opacity-0 duration-200"
      )}
    >
      <button
        type="button"
        aria-label={`${message}. Undo`}
        onClick={() => setLeaving((l) => l ?? "undo")}
        className="inline-flex h-8 items-center gap-1.5 px-3.5 text-sm font-medium text-ui-heading outline-none transition-colors hover:bg-ui-muted/60 focus-visible:ring-2 focus-visible:ring-ui-border-strong"
      >
        <Undo2 className="size-3.5" aria-hidden />
        Undo
      </button>
    </div>
  )
}
