"use client"

import { Sparkles } from "lucide-react"
import { useMemo, useRef, useState, type RefObject } from "react"
import { cn } from "@/lib/utils"
import { MenuLabel, MenuRow, PopoverMenu, useListNav } from "@/components/popover-menu/index"

export type Mention = {
  id: string
  name: string
  description?: string
  kind: "agent" | "person"
  color?: string
  /** Icon inside an agent's tile, instead of the default sparkle. People show their initial. */
  icon?: React.ReactNode
}

/**
 * An agent's square tile or a person's round initial. With a `color` it's filled with that
 * colour; without one it's a quiet neutral chip that matches the rest of the UI.
 */
export function MentionAvatar({ mention, size = 18 }: { mention: Mention; size?: number }) {
  const color = mention.color
  const agent = mention.kind === "agent"
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center",
        agent ? "rounded-[5px] [&_svg]:size-[65%]" : "rounded-full text-[9px] font-semibold",
        color ? "text-white" : "border border-ui-border bg-ui-muted text-ui-secondary",
      )}
      style={{
        width: size,
        height: size,
        background: color
          ? agent
            ? `linear-gradient(135deg, color-mix(in oklab, ${color} 70%, white), ${color})`
            : `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${color} 55%, white), ${color})`
          : undefined,
      }}
    >
      {agent ? (mention.icon ?? <Sparkles />) : mention.name[0]}
    </span>
  )
}

const matches = (query: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(query.toLowerCase()))

/**
 * @ mentions for any textarea you own. Wire `onChange`, `onSelect` and `onKeyDown` into the
 * textarea and render `menu` inside a `relative` box around it. Focus stays in the textarea
 * the whole time: arrows move the highlight, Enter or Tab picks, Escape closes.
 */
export function useMentions({
  mentions,
  value,
  onChange,
  textareaRef,
  menuClassName = "w-64 max-w-full",
}: {
  mentions: Mention[]
  value: string
  onChange: (value: string) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  menuClassName?: string
}) {
  const [at, setAt] = useState<{ start: number; query: string } | null>(null)
  const query = at?.query ?? ""
  const filtered = useMemo(() => mentions.filter((m) => matches(query, m.name, m.description)), [mentions, query])
  const valueRef = useRef(value)
  valueRef.current = value

  /** Opens the list when the word under the caret starts with @. */
  function detect(text: string, caret: number) {
    if (!mentions.length) return setAt(null)
    const match = /(^|\s)@([^\s@]{0,24})$/.exec(text.slice(0, caret))
    setAt(match ? { start: caret - match[2]!.length - 1, query: match[2]! } : null)
  }

  function setCaret(position: number) {
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(position, position)
    })
  }

  function pick(mention: Mention) {
    if (!at) return
    const text = valueRef.current
    const caret = textareaRef.current?.selectionStart ?? text.length
    const insert = `@${mention.name} `
    onChange(text.slice(0, at.start) + insert + text.slice(caret))
    setAt(null)
    setCaret(at.start + insert.length)
  }

  const nav = useListNav(filtered.length, (i) => pick(filtered[i]!), query)

  /** Types an @ at the caret, which opens the list like typing it would. For an @ button. */
  function start() {
    const text = valueRef.current
    const caret = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, caret)
    const insert = before && !/\s$/.test(before) ? " @" : "@"
    onChange(before + insert + text.slice(caret))
    setAt({ start: caret + insert.length - 1, query: "" })
    setCaret(caret + insert.length)
  }

  const groups = (["agent", "person"] as const)
    .map((kind) => ({ kind, items: filtered.filter((m) => m.kind === kind) }))
    .filter((g) => g.items.length)

  const menu = (
    <PopoverMenu open={at !== null && filtered.length > 0} onClose={() => setAt(null)} label="Mention" className={menuClassName}>
      <div role="listbox" aria-label="People and agents" className="max-h-64 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.kind}>
            <MenuLabel>{group.kind === "agent" ? "Agents" : "People"}</MenuLabel>
            {group.items.map((m) => {
              const index = filtered.indexOf(m)
              return (
                <MenuRow
                  key={m.id}
                  inline
                  active={nav.active === index}
                  onHover={() => nav.setActive(index)}
                  onSelect={() => pick(m)}
                  icon={<MentionAvatar mention={m} />}
                  title={m.name}
                  hint={m.description}
                />
              )
            })}
          </div>
        ))}
      </div>
    </PopoverMenu>
  )

  return {
    open: at !== null,
    menu,
    start,
    close: () => setAt(null),
    /** Call from the textarea's onChange after updating your value. */
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => detect(event.target.value, event.target.selectionStart),
    /** Follows the caret when it moves with the arrow keys or a click. */
    onSelect: (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
      if (at) detect(event.currentTarget.value, event.currentTarget.selectionStart)
    },
    /** Returns true when the list handled the key; skip your own handling then. */
    onKeyDown: (event: React.KeyboardEvent) => {
      if (!at) return false
      if (event.key === "Escape") {
        event.preventDefault()
        setAt(null)
        return true
      }
      return nav.onKeyDown(event)
    },
    ariaProps: mentions.length ? { "aria-autocomplete": "list" as const, "aria-expanded": at !== null } : {},
  }
}
