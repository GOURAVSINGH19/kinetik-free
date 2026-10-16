"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { buttonVariants } from "@/components/button/button"
import { cn } from "@/lib/utils"

export interface SegmentedNavItem {
  label: string
  /** Renders the segment as a link instead of a button. */
  href?: string
}

export interface SegmentedNavProps {
  items: SegmentedNavItem[]
  /** Index of the selected segment. Leave unset to let the component track it. */
  value?: number
  defaultValue?: number
  onValueChange?: (index: number) => void
  /** Keep the selected segment open with its label while nothing is hovered. */
  showActive?: boolean
  /** How many neighbours on each side grow toward the hovered segment. */
  spread?: number
  /** Accessible name for the nav landmark. */
  label?: string
  className?: string
}

const TICK_WIDTH = 4
const TICK_HEIGHT = 12
const OPEN_HEIGHT = 26
/** Width each segment takes while the bar is at rest. */
const SLOT = 16
/** Narrowest a segment gets while squeezed beside an open one. */
const MIN_SLOT = 9
const PILL_PADDING = 20
const FALLBACK_PILL = 56

// Critically damped: settles fast without the wobble an underdamped spring adds to every tick.
const spring = { type: "spring", stiffness: 380, damping: 40, mass: 0.7 } as const

export function SegmentedNav({
  items,
  value: controlledValue,
  defaultValue = 0,
  onValueChange,
  showActive = false,
  spread = 3,
  label = "Segmented navigation",
  className,
}: SegmentedNavProps) {
  const reduceMotion = useReducedMotion()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const [rover, setRover] = useState<number | null>(null)
  const refs = useRef<Array<HTMLElement | null>>([])
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([])
  const [pillWidths, setPillWidths] = useState<number[]>([])

  // Measure every label once so the pill animates between plain numbers, never to "auto".
  const labelKey = items.map((item) => item.label).join("\n")
  useLayoutEffect(() => {
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      setPillWidths(measureRefs.current.slice(0, items.length).map((el) => Math.ceil(el?.offsetWidth ?? 0) + PILL_PADDING))
    }
    measure()
    // Measure again once web fonts land, or the pills keep the fallback font's widths.
    document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
    }
  }, [labelKey, items.length])

  // The one segment Tab lands on: the last one focused, or the selection before any focus.
  // Kept in range if items shrink under it.
  const tabStop = Math.min(Math.max(rover ?? value, 0), items.length - 1)

  // Hover wins over keyboard focus, which wins over the resting selection.
  const open = hovered ?? focused ?? (showActive ? value : null)

  const pillWidth = (i: number) => pillWidths[i] || FALLBACK_PILL
  const widestSlot = Math.max(FALLBACK_PILL, ...pillWidths) + 6
  // The bar never changes width, so the open pill takes its room from the other segments.
  // That keeps the cursor inside the segment it opened instead of shoving it onto a neighbour.
  const total = Math.max(items.length * SLOT, widestSlot + (items.length - 1) * MIN_SLOT)
  const restSlot = total / items.length
  const openSlot = open === null ? 0 : pillWidth(open) + 6
  const squeezedSlot = items.length > 1 ? (total - openSlot) / (items.length - 1) : total

  const select = (index: number) => {
    if (controlledValue === undefined) setInternalValue(index)
    onValueChange?.(index)
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = items.length - 1
    const next =
      e.key === "ArrowRight" ? Math.min(index + 1, last)
        : e.key === "ArrowLeft" ? Math.max(index - 1, 0)
          : e.key === "Home" ? 0
            : e.key === "End" ? last
              : null
    if (next === null) return
    e.preventDefault()
    refs.current[next]?.focus()
  }

  const transition = reduceMotion ? { duration: 0 } : spring

  if (items.length === 0) return null

  return (
    <nav aria-label={label} className={cn("relative inline-flex", className)}>
      {/* Zero-size and clipped, so a long row of labels can never widen the page. */}
      <div aria-hidden className="pointer-events-none invisible absolute size-0 overflow-hidden">
        <div className="flex">
          {items.map((item, index) => (
            <span
              key={`${item.label}-${index}`}
              ref={(el) => {
                measureRefs.current[index] = el
              }}
              className="text-[11px] font-medium tracking-wide whitespace-nowrap uppercase"
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div
        className="flex h-11 items-center rounded-full border border-ui-border bg-ui-muted px-2"
        onMouseLeave={() => setHovered(null)}
      >
        <div className="flex h-full" style={{ width: total }}>
          {items.map((item, index) => {
            const isOpen = index === open
            const isActive = index === value
            // 1 at the open segment, fading to 0 past the spread, so neighbours swell like a dock.
            const pull = open === null ? 0 : Math.max(0, 1 - Math.abs(index - open) / (spread + 1))
            const slot = open === null ? restSlot : isOpen ? openSlot : squeezedSlot
            const height = isOpen ? OPEN_HEIGHT : TICK_HEIGHT + pull * 10
            const opacity = isOpen ? 1 : Math.max(isActive ? 0.75 : 0.28, 0.28 + pull * 0.6)

            const Tag = item.href ? motion.a : motion.button

            return (
              <Tag
                key={`${item.label}-${index}`}
                ref={(el: HTMLElement | null) => {
                  refs.current[index] = el
                }}
                {...(item.href ? { href: item.href } : { type: "button" as const })}
                aria-label={item.label}
                aria-current={isActive ? (item.href ? "page" : "true") : undefined}
                tabIndex={index === tabStop ? 0 : -1}
                onClick={() => select(index)}
                onMouseEnter={() => setHovered(index)}
                // Only keyboard focus opens a segment; a mouse click also focuses, and must not pin it open.
                onFocus={(e: React.FocusEvent<HTMLElement>) => {
                  setRover(index)
                  if (e.currentTarget.matches(":focus-visible")) setFocused(index)
                }}
                onBlur={() => setFocused(null)}
                onKeyDown={(e: React.KeyboardEvent) => onKeyDown(e, index)}
                initial={false}
                animate={{ width: slot }}
                transition={transition}
                // The whole slot is the hit area, so the cursor never falls into a gap between ticks.
                className="group flex h-full shrink-0 cursor-pointer items-center justify-center outline-none"
              >
                <motion.span
                  initial={false}
                  animate={{
                    width: isOpen ? pillWidth(index) : TICK_WIDTH,
                    height,
                    opacity,
                    borderRadius: isOpen ? 9 : TICK_WIDTH / 2,
                  }}
                  transition={transition}
                  className={cn(
                    "relative flex shrink-0 items-center justify-center overflow-hidden",
                    isOpen ? cn(buttonVariants(), "h-auto gap-0 px-0") : "border border-transparent bg-ui-heading",
                    "group-focus-visible:ring-2 group-focus-visible:ring-ui-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-ui-muted"
                  )}
                >
                  <motion.span
                    aria-hidden
                    initial={false}
                    animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.85 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.16, delay: isOpen ? 0.06 : 0 }}
                    className="absolute text-[11px] font-medium tracking-wide whitespace-nowrap uppercase select-none"
                  >
                    {item.label}
                  </motion.span>
                </motion.span>
              </Tag>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
