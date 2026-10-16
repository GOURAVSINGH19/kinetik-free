"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Trash2, X } from "lucide-react"
import { Button } from "@/components/button/button"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Covers the header row while rows are picked: the count, Delete, your own actions and Clear.
 * It slides in from the left out of a blur, and back out the same way.
 */
export function SelectionBar({
  count,
  offset,
  height,
  onDelete,
  onClear,
  children,
}: {
  count: number
  /** Leaves the header's select-all checkbox uncovered. */
  offset: number
  height: number
  onDelete?: () => void
  onClear: () => void
  /** Extra bulk actions. */
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, x: -24, filter: "blur(8px)" }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          role="toolbar"
          aria-label="Selected rows"
          initial={hidden}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={hidden}
          transition={{ duration: reduce ? 0.12 : 0.32, ease: EASE }}
          style={{ left: offset, height }}
          className="absolute top-0 right-0 z-30 flex items-center gap-2 border-b border-ui-border bg-ui-subtle pr-3 pl-1"
        >
          <span aria-live="polite" className="me-1 text-sm font-medium whitespace-nowrap text-ui-heading tabular-nums">
            {count} selected
          </span>
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 aria-hidden />
              Delete
            </Button>
          )}
          {children}
          <Button variant="ghost" size="sm" onClick={onClear} className="ms-auto">
            <X aria-hidden />
            Clear
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
