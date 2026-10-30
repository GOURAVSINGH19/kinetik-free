"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Mic, X } from "lucide-react"
import { cn } from "@/lib/utils"

const POP_SPRING = { type: "spring", stiffness: 420, damping: 24 } as const

function Waveform() {
  return (
    <span aria-hidden className="flex h-3.5 items-center gap-[2px]">
      {[0.5, 1, 0.7, 0.9].map((peak, index) => (
        <motion.span
          key={index}
          className="w-[2px] rounded-full bg-current"
          animate={{ height: ["30%", `${peak * 100}%`, "30%"] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: index * 0.12, ease: "easeInOut" }}
        />
      ))}
    </span>
  )
}

/**
 * The mic. Press to listen, press again to stop and keep the words. While listening it turns
 * accent-coloured, pulses a ring and grows a small waveform, and — when `onCancel` is given —
 * a ✕ pops in beside it to stop and throw the words away. Renders nothing where `supported` is false.
 */
export function DictationButton({
  supported = true,
  listening,
  onToggle,
  onCancel,
  className,
}: {
  supported?: boolean
  listening: boolean
  onToggle: () => void
  /** Stop and discard. Shows a ✕ next to the mic while listening. */
  onCancel?: () => void
  className?: string
}) {
  const reduce = useReducedMotion()
  const spring = reduce ? { duration: 0 } : POP_SPRING
  if (!supported) return null
  return (
    <span className="flex items-center gap-1">
      <AnimatePresence initial={false}>
        {listening && onCancel && (
          <motion.button
            key="cancel"
            type="button"
            aria-label="Cancel voice input"
            title="Cancel"
            onClick={onCancel}
            initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            whileTap={{ scale: 0.88 }}
            transition={spring}
            className={cn(
              "grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-ui-caption transition-colors outline-none hover:bg-ui-muted hover:text-ui-heading focus-visible:ring-2 focus-visible:ring-ui-accent/60",
              className,
              // Square at whatever height the mic was given.
              "aspect-square w-auto min-w-0 px-0",
            )}
          >
            <X className="size-4" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        aria-pressed={listening}
        onClick={onToggle}
        whileTap={{ scale: 0.88 }}
        transition={spring}
        className={cn(
          "relative flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-ui-caption transition-colors outline-none hover:bg-ui-muted hover:text-ui-heading focus-visible:ring-2 focus-visible:ring-ui-accent/60",
          listening && "bg-ui-accent/12 text-ui-accent hover:bg-ui-accent/15 hover:text-ui-accent",
          className,
        )}
      >
        {listening && !reduce && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-[inherit] ring-2 ring-ui-accent"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <Mic className="size-4" aria-hidden />
        {listening && <Waveform />}
      </motion.button>
    </span>
  )
}
