"use client"

import { AtSign, CornerDownLeft } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useMentions, type Mention } from "./use-mentions"

export type MentionInputProps = {
  mentions: Mention[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Enter submits (Shift+Enter breaks a line). Omit to let Enter add a line. */
  onSubmit?: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

/** A growing text field where @ brings up agents and people to tag. */
export function MentionInput({
  mentions,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  placeholder = "Type @ to mention someone…",
  label = "Message",
  className,
}: MentionInputProps) {
  const [own, setOwn] = useState(defaultValue)
  const value = valueProp ?? own
  const setValue = (next: string) => {
    setOwn(next)
    onValueChange?.(next)
  }
  const ref = useRef<HTMLTextAreaElement>(null)
  const mention = useMentions({ mentions, value, onChange: setValue, textareaRef: ref })
  const submit = () => {
    const text = value.trim()
    if (!text || !onSubmit) return
    onSubmit(text)
    setValue("")
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`
  }, [value])

  return (
    <div
      className={cn(
        "relative flex items-start gap-1 rounded-xl border border-ui-border bg-ui-subtle p-1.5 transition-shadow",
        "focus-within:border-ui-border-strong focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ui-accent)_18%,transparent)]",
        className,
      )}
    >
      {mention.menu}
      <textarea
        ref={ref}
        rows={1}
        value={value}
        aria-label={label}
        placeholder={placeholder}
        {...mention.ariaProps}
        onChange={(event) => {
          setValue(event.target.value)
          mention.onChange(event)
        }}
        onSelect={mention.onSelect}
        onKeyDown={(event) => {
          if (mention.onKeyDown(event)) return
          if (onSubmit && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit()
          }
        }}
        className="min-h-7 w-full resize-none bg-transparent px-1.5 text-[14px] leading-7 text-ui-heading outline-none placeholder:text-ui-hint"
      />
      <button
        type="button"
        aria-label="Mention"
        onClick={mention.start}
        className="grid size-7 shrink-0 place-items-center rounded-md text-ui-caption transition-colors hover:bg-ui-muted hover:text-ui-heading"
      >
        <AtSign className="size-4" />
      </button>
      {onSubmit && (
        <button
          type="button"
          aria-label="Send"
          disabled={!value.trim()}
          onClick={submit}
          className="grid size-7 shrink-0 place-items-center rounded-md bg-ui-inverse text-ui-on-inverse transition-colors disabled:bg-ui-muted disabled:text-ui-hint"
        >
          <CornerDownLeft className="size-3.5" />
        </button>
      )}
    </div>
  )
}
