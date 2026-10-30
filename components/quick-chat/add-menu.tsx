"use client"

import { AtSign, Paperclip } from "lucide-react"
import type { RefObject } from "react"
import { MenuLabel, MenuRow, PopoverMenu, useListNav } from "@/components/popover-menu/index"

/** The + menu: upload a file or tag someone. Rows only show when wired. */
export function AddMenu({
  open,
  onClose,
  anchorRef,
  onUpload,
  onMention,
}: {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  onUpload?: () => void
  onMention?: () => void
}) {
  const items = [
    onUpload && { key: "upload", icon: <Paperclip className="size-3.5" />, title: "Upload file", hint: "Images, PDFs and docs", run: onUpload },
    onMention && { key: "mention", icon: <AtSign className="size-3.5" />, title: "Tag someone", hint: "Bring in an agent or teammate", run: onMention },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; title: string; hint: string; run: () => void }[]

  const nav = useListNav(items.length, (i) => items[i]!.run())

  return (
    <PopoverMenu open={open} onClose={onClose} anchorRef={anchorRef} label="Add" className="w-64 max-w-full">
      <div
        role="listbox"
        aria-label="Add to message"
        tabIndex={0}
        data-autofocus
        onKeyDown={(event) => void nav.onKeyDown(event)}
        className="outline-none"
      >
        <MenuLabel>Add to message</MenuLabel>
        {items.map((item, i) => (
          <MenuRow
            key={item.key}
            active={nav.active === i}
            onHover={() => nav.setActive(i)}
            onSelect={item.run}
            icon={<span className="grid size-6 place-items-center rounded-md bg-ui-muted text-ui-secondary">{item.icon}</span>}
            title={item.title}
            hint={item.hint}
          />
        ))}
      </div>
    </PopoverMenu>
  )
}
