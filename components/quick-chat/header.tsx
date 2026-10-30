"use client"

import { AnimatePresence, motion } from "framer-motion"
import { AppWindow, ArrowLeft, Check, History, Maximize2, Minimize2, PanelRight, SquarePen, X } from "lucide-react"
import { useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { IconButton } from "./parts"
import { MenuLabel, MenuRow, PopoverMenu, useListNav } from "@/components/popover-menu/index"
import type { QuickChatLayout } from "./types"

const LAYOUTS: { id: QuickChatLayout; label: string; icon: typeof PanelRight }[] = [
  { id: "drawer", label: "Side drawer", icon: PanelRight },
  { id: "full", label: "Full page", icon: Maximize2 },
  { id: "popup", label: "Pop up", icon: AppWindow },
  { id: "minimized", label: "Minimize", icon: Minimize2 },
]

function LayoutMenu({ layout, onChange }: { layout: QuickChatLayout; onChange: (layout: QuickChatLayout) => void }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const pick = (id: QuickChatLayout) => {
    setOpen(false)
    onChange(id)
  }
  const nav = useListNav(LAYOUTS.length, (i) => pick(LAYOUTS[i]!.id))
  const Current = LAYOUTS.find((l) => l.id === layout)?.icon ?? AppWindow

  return (
    <div className="relative">
      <IconButton buttonRef={anchor} label="Switch layout" active={open} onClick={() => setOpen((v) => !v)}>
        <Current className="size-3.5" />
      </IconButton>
      <PopoverMenu open={open} onClose={() => setOpen(false)} anchorRef={anchor} side="bottom" align="end" label="Switch layout" className="w-44">
        <div role="listbox" aria-label="Layouts" tabIndex={0} data-autofocus onKeyDown={(e) => void nav.onKeyDown(e)} className="outline-none">
          <MenuLabel>Switch layout</MenuLabel>
          {LAYOUTS.map(({ id, label, icon: Icon }, i) => (
            <MenuRow
              key={id}
              active={nav.active === i}
              onHover={() => nav.setActive(i)}
              onSelect={() => pick(id)}
              icon={<Icon aria-hidden className="size-3.5 text-ui-caption" />}
              title={label}
              trailing={layout === id ? <Check aria-hidden className="size-3.5 text-ui-caption" /> : null}
            />
          ))}
        </div>
      </PopoverMenu>
    </div>
  )
}

/** Cuts a title to its first `max` words, adding "…" when anything was dropped. */
export function clampWords(text: string, max = 12) {
  const words = text.trim().split(/\s+/)
  return words.length > max ? `${words.slice(0, max).join(" ")}…` : text.trim()
}

/**
 * The chat's name. Long names stop after 12 words with "…"; hovering or focusing shows the
 * whole name in a tooltip. Narrow panels also cut it with an ellipsis, and the tooltip covers that too.
 */
function Title({ title }: { title: string }) {
  const [tip, setTip] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const short = clampWords(title)
  const id = useId()

  const show = () => {
    // The ref sits on the wrapper: AnimatePresence reads its child's ref, which React 19 warns about.
    const el = ref.current?.querySelector<HTMLElement>("[data-title]")
    const cut = short !== title.trim() || (el ? el.scrollWidth > el.clientWidth : false)
    if (!cut) return
    timer.current = setTimeout(() => setTip(true), 250)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setTip(false)
  }
  const long = short !== title.trim()

  return (
    <span ref={ref} className="relative min-w-0" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={title}
          data-title
          tabIndex={long ? 0 : undefined}
          aria-describedby={tip ? id : undefined}
          initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
          transition={{ duration: 0.2 }}
          className="block truncate rounded text-[13px] font-medium text-ui-heading outline-none focus-visible:ring-2 focus-visible:ring-ui-accent/50"
        >
          {short}
        </motion.span>
      </AnimatePresence>
      <AnimatePresence>
        {tip && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 z-40 mt-2 w-max max-w-[min(360px,80vw)] rounded-lg bg-ui-inverse px-2.5 py-1.5 text-[12px] leading-snug font-normal whitespace-normal text-ui-on-inverse shadow-lg"
          >
            {title}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function Header({
  title,
  view,
  layout,
  historyCount,
  onLayout,
  onRestore,
  onHistory,
  onNew,
  onClose,
}: {
  title: string
  view: "chat" | "history"
  layout: QuickChatLayout
  historyCount: number
  onLayout: (layout: QuickChatLayout) => void
  onRestore: () => void
  /** Opens the History view, or goes back to the chat from it. */
  onHistory: () => void
  onNew?: () => void
  onClose?: () => void
}) {
  const minimized = layout === "minimized"
  const history = view === "history" && !minimized

  return (
    <header className={cn("flex h-11 shrink-0 items-center gap-1.5 px-2.5", !minimized && "border-b border-ui-border")}>
      {history ? (
        <>
          <IconButton label="Back to chat" onClick={onHistory}>
            <ArrowLeft className="size-3.5" />
          </IconButton>
          <span className="text-[13px] font-medium text-ui-heading">History</span>
          <span className="text-[12px] text-ui-hint tabular-nums">{historyCount}</span>
        </>
      ) : minimized ? (
        <button
          type="button"
          onClick={onRestore}
          aria-label={`Restore chat: ${title}`}
          className="min-w-0 flex-1 truncate pl-1 text-left text-[13px] font-medium text-ui-heading"
        >
          {clampWords(title)}
        </button>
      ) : (
        <div className="flex min-w-0 items-center pl-1">
          <Title title={title} />
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        {!minimized && !history && (
          <IconButton label="History" onClick={onHistory}>
            <History className="size-3.5" />
          </IconButton>
        )}
        {onNew && !minimized && (
          <IconButton label="New chat" onClick={onNew}>
            <SquarePen className="size-3.5" />
          </IconButton>
        )}
        {minimized ? (
          <IconButton label="Restore" onClick={onRestore}>
            <Maximize2 className="size-3.5" />
          </IconButton>
        ) : (
          <LayoutMenu layout={layout} onChange={onLayout} />
        )}
        {onClose && (
          <IconButton label="Close" onClick={onClose}>
            <X className="size-3.5" />
          </IconButton>
        )}
      </div>
    </header>
  )
}
