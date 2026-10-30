export type ModelOption = {
  id: string
  name: string
  description?: string
  /** Shown as a small pill, e.g. "New" or "Pro". */
  badge?: string
  /** Colour of the model's glyph. */
  color?: string
  /** Replaces the default glyph. */
  icon?: React.ReactNode
  /** Icon drawn inside the coloured tile, in place of the sparkle. Ignored when `icon` is set. */
  glyph?: React.ReactNode
  disabled?: boolean
}

export type ModelSelectorProps = {
  models: ModelOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Adds an "Extended thinking" switch under the list when set. */
  thinking?: boolean
  onThinkingChange?: (on: boolean) => void
  /** Which side of the trigger the menu opens on. */
  side?: "top" | "bottom"
  align?: "start" | "end"
  label?: string
  className?: string
  /** Extra classes for the pill, e.g. to size it for a toolbar. */
  triggerClassName?: string
  /** "sm" makes the menu compact: smaller text and icons, a narrower list. For tight spaces like a chat panel. */
  size?: "default" | "sm"
}

/** The compact pill used when the selector sits in a composer toolbar (Prompt Input, Quick Chat). */
export const TOOLBAR_TRIGGER = "h-8 border-transparent bg-ui-muted pl-1.5 text-[13px] shadow-none hover:bg-ui-emphasis"

export const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } as const
