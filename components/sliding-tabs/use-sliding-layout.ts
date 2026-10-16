import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { GAP, ICON_SLOT, INSET, type SlidingTab, type SlidingTabsCollapse } from "./types"

/** Slightly longer than the 250ms slide, so a measure never cuts one short. */
const SETTLE_MS = 300

/**
 * Places the pill, each label's active-colour clip and each icon slot for where the selected tab
 * will end up, so all three travel together. Written straight to the DOM: no re-render
 * mid-animation. Also decides when the labels no longer fit and the tabs collapse to icons.
 */
export function useSlidingLayout(tabs: SlidingTab[], active: number, collapse: SlidingTabsCollapse) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [iconOnly, setIconOnly] = useState(collapse === "always")
  const iconOnlyRef = useRef(iconOnly)
  // Each tab's width with its icon slot closed, its horizontal padding, and the room the labels need.
  const widths = useRef<number[]>([])
  const padding = useRef(16)
  const labelsNeed = useRef(0)
  const activeRef = useRef(active)
  const settling = useRef(0)

  const place = useCallback(
    (index: number, instant = false) => {
      const pill = pillRef.current
      if (!pill || !widths.current.length) return
      const slot = (k: number) => (k === index && tabs[k]?.icon && !iconOnlyRef.current ? ICON_SLOT : 0)
      let x = INSET
      const spots = tabs.map((_, k) => {
        const spot = { x, width: (widths.current[k] ?? 0) + slot(k) }
        x += spot.width + GAP
        return spot
      })
      const target = spots[index]
      if (!target) return
      const transition = instant ? "none" : ""
      if (!instant) settling.current = performance.now() + SETTLE_MS

      pill.style.transition = transition
      pill.style.transform = `translateX(${target.x}px)`
      pill.style.width = `${target.width}px`

      tabRefs.current.forEach((tab, k) => {
        const spot = spots[k]
        if (!tab || !spot) return
        tab.querySelectorAll<HTMLElement>("[data-icon-slot]").forEach((el) => {
          el.style.transition = transition
          el.style.width = `${slot(k)}px`
        })
        // The overlay label starts inside the tab's padding, so clip relative to that.
        const overlay = tab.querySelector<HTMLElement>("[data-overlay]")
        if (!overlay) return
        const left = target.x - (spot.x + padding.current)
        const right = spot.x + spot.width - padding.current - (target.x + target.width)
        overlay.style.transition = transition
        overlay.style.clipPath = `inset(0 ${right}px 0 ${left}px)`
      })
    },
    [tabs]
  )

  const labelKey = tabs.map((tab) => tab.label).join("\n")
  const allHaveIcons = tabs.every((tab) => tab.icon)
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    let alive = true
    let later = 0

    const measure = () => {
      if (!alive) return
      // A resize that lands mid-slide waits for the slide to finish, instead of snapping it.
      const wait = settling.current - performance.now()
      if (wait > 0) {
        clearTimeout(later)
        later = window.setTimeout(measure, wait)
        return
      }
      tabRefs.current.forEach((tab) =>
        tab?.querySelectorAll<HTMLElement>("[data-icon-slot]").forEach((el) => {
          el.style.transition = "none"
          el.style.width = "0px"
        })
      )
      widths.current = tabRefs.current.map((tab) => tab?.getBoundingClientRect().width ?? 0)
      const firstTab = tabRefs.current[0]
      if (firstTab) padding.current = parseFloat(getComputedStyle(firstTab).paddingLeft)

      // Labels need the full row, plus the active icon and the list's padding and border.
      if (!iconOnlyRef.current) {
        labelsNeed.current = widths.current.reduce((sum, w) => sum + w, 0) + GAP * (tabs.length - 1) + INSET * 2 + ICON_SLOT + 2
      }
      const collapsed = collapse === "always" || (collapse === "auto" && allHaveIcons && root.clientWidth < labelsNeed.current)
      if (collapsed !== iconOnlyRef.current) {
        iconOnlyRef.current = collapsed
        setIconOnly(collapsed) // re-renders; this effect runs again and measures the new layout
        return
      }
      place(activeRef.current, true)
    }

    // The container's width decides labels or icons; the tab list changes when a web font swaps
    // in. The list also grows as an icon slot opens, which the settle wait above lets finish.
    const resize = new ResizeObserver(measure)
    resize.observe(root)
    const list = root.querySelector('[role="tablist"]')
    if (list) resize.observe(list)
    document.fonts?.ready.then(measure)
    document.fonts?.addEventListener("loadingdone", measure)
    return () => {
      alive = false
      clearTimeout(later)
      resize.disconnect()
      document.fonts?.removeEventListener("loadingdone", measure)
    }
  }, [labelKey, place, collapse, allHaveIcons, iconOnly, tabs.length])

  // Slide whenever the selection changes; the first placement is instant (done by the measure).
  useLayoutEffect(() => {
    if (activeRef.current === active) return
    activeRef.current = active
    place(active)
  }, [active, place])

  return { rootRef, pillRef, tabRefs, iconOnly }
}
