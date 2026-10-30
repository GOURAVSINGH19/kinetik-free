"use client"

import { motion, useReducedMotion } from "framer-motion"
import { AlertCircle, Check, Copy, FileText, Heart, RotateCcw } from "lucide-react"
import { useState, type Ref } from "react"
import { cn } from "@/lib/utils"
import { ToolCalls } from "@/components/tool-calls/index"
import { SPRING, type QuickChatMessage } from "./types"


export function IconButton({
  label,
  onClick,
  active,
  className,
  buttonRef,
  children,
}: {
  label: string
  onClick?: () => void
  active?: boolean
  className?: string
  buttonRef?: Ref<HTMLButtonElement>
  children: React.ReactNode
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md text-ui-caption transition-colors",
        "hover:bg-ui-muted hover:text-ui-heading focus-visible:outline-2 focus-visible:outline-ui-accent",
        active && "bg-ui-muted text-ui-heading",
        className,
      )}
    >
      {children}
    </button>
  )
}


function BlurText({ text }: { text: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{text}</>
  const parts = text.split(/(\s+)/)
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {parts.map((part, i) =>
          /^\s*$/.test(part) ? (
            part
          ) : (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {part}
            </motion.span>
          ),
        )}
      </span>
    </>
  )
}

function UserBubble({ message }: { message: QuickChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-1.5 pl-10">
      {message.attachments?.length ? (
        <ul className="flex flex-wrap justify-end gap-1.5">
          {message.attachments.map((a, i) => (
            <li
              key={`${a.name}-${i}`}
              className="flex items-center gap-1.5 rounded-md border border-ui-border px-2 py-1 text-[12px] text-ui-secondary"
            >
              <FileText aria-hidden className="size-3.5" />
              <span className="max-w-40 truncate">{a.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {message.text && (
        <p className="rounded-xl bg-ui-muted px-3.5 py-2.5 text-[14px] leading-[22px] whitespace-pre-wrap text-ui-heading">
          {message.text}
        </p>
      )}
    </div>
  )
}

function Thinking() {
  return (
    <div role="status" className="flex items-center gap-2 text-[13px] text-ui-caption">
      <span className="animate-pulse">Thinking…</span>
    </div>
  )
}

function AssistantMessage({ message, onRetry }: { message: QuickChatMessage; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const settled = message.status === "done" || message.status === "stopped" || message.status === "error"

  if (message.status === "pending") return <Thinking />

  const copy = () => {
    navigator.clipboard?.writeText(message.text).catch(() => { })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="flex flex-col gap-2">
      {message.tools?.length ? <ToolCalls calls={message.tools} /> : null}
      {message.status === "error" ? (
        <p role="alert" className="flex items-start gap-2 text-[14px] leading-[22px] text-rose-500">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {message.text}
        </p>
      ) : (
        <p className="text-[14px] leading-[26px] whitespace-pre-wrap text-ui-heading">
          <BlurText text={message.text} />
          {message.status === "streaming" && (
            <span aria-hidden className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-ui-heading" />
          )}
        </p>
      )}
      <motion.div initial={false} animate={{ opacity: settled ? 1 : 0 }} className="flex items-center justify-end gap-0.5">
        {message.status === "stopped" && <span className="mr-auto text-[12px] text-ui-hint">Stopped</span>}
        {message.status !== "error" && (
          <>
            <IconButton label={copied ? "Copied" : "Copy"} onClick={copy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </IconButton>
            <IconButton label="Like" active={liked} onClick={() => setLiked((v) => !v)}>
              <Heart className={cn("size-3.5", liked && "fill-rose-500 text-rose-500")} />
            </IconButton>
          </>
        )}
        {onRetry && settled && (
          <IconButton label="Retry" onClick={onRetry}>
            <RotateCcw className="size-3.5" />
          </IconButton>
        )}
      </motion.div>
    </div>
  )
}

export function MessageRow({ message, onRetry }: { message: QuickChatMessage; onRetry?: () => void }) {
  const reduce = useReducedMotion()
  return (
    <motion.li
      layout="position"
      initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={SPRING}
    >
      {message.role === "user" ? <UserBubble message={message} /> : <AssistantMessage message={message} onRetry={onRetry} />}
    </motion.li>
  )
}
