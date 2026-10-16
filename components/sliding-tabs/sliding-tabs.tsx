"use client"

import { useId, useLayoutEffect, useRef, useState } from "react"
import { buttonVariants } from "@/components/button/button"
import { cn } from "@/lib/utils"
import { TabLabel } from "./tab-label"
import { EASE, type SlidingTabsProps } from "./types"
import { useSlidingLayout } from "./use-sliding-layout"

export function SlidingTabs({
  tabs,
  value: controlledValue,
  defaultValue,
  onValueChange,
  label = "Tabs",
  collapse = "auto",
  className,
  panelClassName,
}: SlidingTabsProps) {
  const id = useId()
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs[0]?.value)
  const value = controlledValue ?? internalValue
  const active = Math.max(0, tabs.findIndex((tab) => tab.value === value))
  const { rootRef, pillRef, tabRefs, iconOnly } = useSlidingLayout(tabs, active, collapse)

  // The new tab's panel fades in. The browser animates it, so this works when the parent
  // controls `value` too, with no extra render.
  const panelRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(active)
  useLayoutEffect(() => {
    if (shownRef.current === active) return
    shownRef.current = active
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const shown = panelRef.current?.children[active] as HTMLElement | undefined
    shown?.animate(
      [
        { opacity: 0, filter: "blur(3px)", translate: "0 3px" },
        { opacity: 1, filter: "blur(0px)", translate: "0 0" },
      ],
      { duration: reduced ? 0 : 250, easing: EASE }
    )
  }, [active])

  const tipRef = useRef<HTMLSpanElement>(null)
  const showTip = (tab: HTMLElement, text: string) => {
    const tip = tipRef.current
    const root = rootRef.current
    if (!tip || !root || !iconOnly) return
    const tabBox = tab.getBoundingClientRect()
    const centre = tabBox.left + tabBox.width / 2 - root.getBoundingClientRect().left
    tip.textContent = text
    tip.style.transform = `translateX(${centre}px) translateX(-50%)`
    tip.style.opacity = "1"
  }
  const hideTip = () => {
    if (tipRef.current) tipRef.current.style.opacity = "0"
  }

  const select = (index: number, focus = false) => {
    const next = tabs[index]
    if (!next) return
    if (controlledValue === undefined) setInternalValue(next.value)
    onValueChange?.(next.value)
    if (focus) tabRefs.current[index]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
        : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
          : event.key === "Home" ? 0
            : event.key === "End" ? last
              : null
    if (next === null) return
    event.preventDefault()
    select(next, true)
  }

  const hasPanels = tabs.some((tab) => tab.content !== undefined)

  return (
    <div ref={rootRef} className={cn("relative flex flex-col items-start gap-3", className)}>
      {/* Icon-only tabs name themselves in a tooltip that glides to the hovered or focused icon.
          It lives outside the tab list, which scrolls and would clip it. */}
      <span
        ref={tipRef}
        aria-hidden
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 rounded-md bg-ui-inverse px-2 py-1 text-xs font-medium whitespace-nowrap text-ui-on-inverse opacity-0 transition-[transform,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      />
      <div
        role="tablist"
        aria-label={label}
        className="relative inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-ui-border bg-ui-muted p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* The pill wears the default button style, minus its own size and padding. */}
        <span
          ref={pillRef}
          aria-hidden
          className={cn(
            buttonVariants(),
            "pointer-events-none absolute inset-y-[3px] left-0 h-auto p-0 transition-[transform,width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          )}
        />
        {tabs.map((tab, index) => {
          const selected = index === active
          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={selected}
              aria-controls={hasPanels ? `${id}-panel` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              onPointerEnter={(event) => showTip(event.currentTarget, tab.label)}
              onPointerLeave={hideTip}
              onFocus={(event) => event.currentTarget.matches(":focus-visible") && showTip(event.currentTarget, tab.label)}
              onBlur={hideTip}
              className={cn(
                "group relative z-10 flex-none cursor-pointer rounded-full py-1.5 text-sm font-medium whitespace-nowrap text-ui-secondary outline-none transition-[color,scale] duration-150 ease-out hover:text-ui-heading focus-visible:ring-2 focus-visible:ring-ui-border-strong active:not-aria-selected:scale-[0.96] motion-reduce:transition-none",
                iconOnly ? "px-3.5" : "px-4"
              )}
            >
              <span className="relative grid">
                <TabLabel tab={tab} iconOnly={iconOnly} />
                <TabLabel tab={tab} iconOnly={iconOnly} overlay />
              </span>
            </button>
          )
        })}
      </div>

      {hasPanels && (
        // Every tab's content sits in the same grid cell, only the active one visible, so the box
        // keeps the size of the largest and switching never shifts the tabs or the page.
        <div
          ref={panelRef}
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
          tabIndex={0}
          className={cn(
            "grid self-stretch rounded-xl border border-ui-border p-4 text-sm text-ui-secondary outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong",
            panelClassName
          )}
        >
          {tabs.map((tab, index) => (
            <div
              key={tab.value}
              aria-hidden={index !== active || undefined}
              inert={index !== active}
              className={cn("col-start-1 row-start-1", index !== active && "invisible")}
            >
              {tab.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
