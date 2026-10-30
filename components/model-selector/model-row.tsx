"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Brain, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Glyph } from "./model-trigger"
import type { ModelOption } from "./types"

/** One option: glyph, name, badge and description, a sliding hover highlight and a popping check. */
export function ModelRow({
  model, index, optionId, highlightId, isActive, isSelected, fromTop, onHover, onPick, small,
}: {
  model: ModelOption
  index: number
  optionId: string
  highlightId: string
  isActive: boolean
  isSelected: boolean
  fromTop: boolean
  onHover: () => void
  onPick: () => void
  small?: boolean
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      id={optionId}
      role="option"
      aria-selected={isSelected}
      aria-disabled={model.disabled || undefined}
      onPointerMove={() => !model.disabled && onHover()}
      onClick={onPick}
      initial={{ opacity: 0, y: fromTop ? -4 : 4 }}
      animate={{ opacity: model.disabled ? 0.45 : 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { delay: 0.03 + index * 0.025, duration: 0.2 }}
      // The active row sits below its siblings so the sliding highlight passes under their text.
      className={cn(
        "relative flex cursor-pointer items-start rounded-xl",
        small ? "gap-2.5 px-2 py-1.5" : "gap-3 px-2.5 py-2",
        isActive ? "z-0" : "z-10",
        model.disabled && "cursor-not-allowed"
      )}
    >
      {isActive && !model.disabled && (
        <motion.span
          layoutId={highlightId}
          className="absolute inset-0 rounded-xl bg-ui-muted"
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 40 }}
        />
      )}
      <span className="relative mt-px">
        <Glyph model={model} size={small ? 18 : 22} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className={cn("flex items-center gap-1.5 font-medium text-ui-heading", small ? "text-[13px] leading-[18px]" : "text-sm")}>
          {model.name}
          {model.badge && (
            <span className="rounded-full bg-ui-accent/12 px-1.5 py-px text-[10px] font-medium tracking-wide text-ui-accent uppercase">
              {model.badge}
            </span>
          )}
        </span>
        {model.description && (
          <span className={cn("block leading-snug text-ui-caption", small ? "text-[11.5px]" : "mt-0.5 text-xs")}>{model.description}</span>
        )}
      </span>
      <span className="relative mt-0.5 size-4 shrink-0">
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.span
              className="absolute inset-0 grid place-items-center text-ui-accent"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 26 }}
            >
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.div>
  )
}

/** The footer row of the menu: "Extended thinking" with a switch. */
export function ThinkingSwitch({ on, onChange, small }: { on: boolean; onChange: (on: boolean) => void; small?: boolean }) {
  return (
    <div className={cn("mt-1.5 flex items-center border-t border-ui-border pb-1.5", small ? "gap-2.5 px-2 pt-2" : "gap-3 px-2.5 pt-2.5")}>
      <Brain className={cn("text-ui-caption", small ? "size-3.5" : "size-4")} aria-hidden />
      <span className="flex-1">
        <span className={cn("block font-medium text-ui-heading", small ? "text-[13px]" : "text-sm")}>Extended thinking</span>
        <span className={cn("block text-ui-caption", small ? "text-[11.5px]" : "text-xs")}>Think longer for harder tasks</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Extended thinking"
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-5 w-8 shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ui-accent/50",
          on ? "bg-ui-accent" : "bg-ui-emphasis"
        )}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)]"
          animate={{ x: on ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 700, damping: 35 }}
        />
      </button>
    </div>
  )
}
