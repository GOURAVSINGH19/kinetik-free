import type { ReactNode } from "react"

export interface SlidingTab {
  value: string
  label: string
  /** Shown only on the active tab, where it grows in beside the label. */
  icon?: ReactNode
  /** Panel content. Leave every tab without content to render the tab list alone. */
  content?: ReactNode
}

export type SlidingTabsCollapse = "auto" | "never" | "always"

export interface SlidingTabsProps {
  tabs: SlidingTab[]
  /** The selected tab's value. Leave unset to let the component track it. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Accessible name for the tab list. */
  label?: string
  /**
   * When to show icons instead of labels. `auto` collapses when the labels don't fit the width,
   * such as on a phone; it needs every tab to have an icon. Labels stay readable to screen readers.
   */
  collapse?: SlidingTabsCollapse
  className?: string
  panelClassName?: string
}

/** Room the active tab's icon takes: a 16px icon plus its gap. */
export const ICON_SLOT = 22
/** The list's padding and the gap between tabs, matching p-[3px] and gap-0.5. */
export const INSET = 3
export const GAP = 2
export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
