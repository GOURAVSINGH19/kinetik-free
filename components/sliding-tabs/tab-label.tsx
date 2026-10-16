import { cn } from "@/lib/utils"
import type { SlidingTab } from "./types"

const MOTION = "duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"

/**
 * One layer of a tab's label. Each tab renders two: the muted one, and an overlay copy in the
 * active colour, clipped to wherever the pill sits. As the pill slides, the colour changes
 * exactly at its edges instead of fading tab by tab.
 *
 * Collapsed to icons (on narrow screens), every tab shows its icon and the label is kept for
 * screen readers only.
 */
export function TabLabel({ tab, overlay = false, iconOnly = false }: { tab: SlidingTab; overlay?: boolean; iconOnly?: boolean }) {
  return (
    <span
      data-overlay={overlay ? "" : undefined}
      aria-hidden={overlay || undefined}
      className={cn(
        "col-start-1 row-start-1 flex items-center justify-center",
        overlay && cn("pointer-events-none text-ui-on-inverse transition-[clip-path]", MOTION)
      )}
    >
      {iconOnly ? (
        <>
          <span className="flex [&_svg]:size-4">{tab.icon}</span>
          {!overlay && <span className="sr-only">{tab.label}</span>}
        </>
      ) : (
        <>
          {tab.icon && (
            <span
              data-icon-slot
              className={cn("flex justify-end overflow-hidden transition-[width]", MOTION)}
              style={{ width: 0 }}
            >
              <span
                className={cn(
                  "flex shrink-0 scale-25 pe-1.5 opacity-0 blur-[4px] transition-[opacity,scale,filter] [&_svg]:size-4",
                  "group-aria-selected:scale-100 group-aria-selected:opacity-100 group-aria-selected:blur-none",
                  MOTION
                )}
              >
                {tab.icon}
              </span>
            </span>
          )}
          {tab.label}
        </>
      )}
    </span>
  )
}
