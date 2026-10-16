import type { ReactNode } from "react"

/** One row in a menu. Leave `type` off for a plain item. */
export type MenubarEntry =
  | {
      type?: "item"
      label: string
      icon?: ReactNode
      /** Display only, e.g. "Ctrl S". Wire the real shortcut yourself. */
      shortcut?: string
      disabled?: boolean
      /** Draws the item in red, for actions like Delete. */
      destructive?: boolean
      onSelect?: () => void
    }
  | {
      type: "checkbox"
      label: string
      checked: boolean
      onCheckedChange: (checked: boolean) => void
      shortcut?: string
    }
  | { type: "submenu"; label: string; icon?: ReactNode; items: MenubarEntry[] }
  | { type: "label"; label: string }
  | { type: "separator" }

export interface MenubarMenu {
  label: string
  items: MenubarEntry[]
}

export interface MenubarProps {
  menus: MenubarMenu[]
  /** Accessible name for the menubar. */
  label?: string
  className?: string
}

/** How long panels and highlights take, and their ease, shared by every moving part. */
export const MOTION = "duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
