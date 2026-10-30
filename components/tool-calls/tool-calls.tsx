"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronRight, LoaderCircle, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export type ToolCall = string | { name: string; status?: "running" | "done" | "error"; detail?: string }

const normalize = (call: ToolCall) => (typeof call === "string" ? { name: call, status: "done" as const } : call)

function StatusIcon({ status = "done" }: { status?: "running" | "done" | "error" }) {
  if (status === "running") return <LoaderCircle aria-label="Running" className="size-3.5 animate-spin text-ui-caption" />
  if (status === "error") return <X aria-label="Failed" className="size-3.5 text-rose-500" />
  return <Check aria-label="Done" className="size-3.5 text-emerald-500" />
}

/**
 * A collapsed "N tools used" line under an agent's reply that opens to list each call.
 * While any call is running it reads "Using N tools…".
 */
export function ToolCalls({
  calls,
  icon = <Sparkles aria-hidden className="size-3.5 text-ui-accent" />,
  defaultOpen = false,
  className,
}: {
  calls: ToolCall[]
  icon?: React.ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const items = calls.map(normalize)
  const running = items.some((c) => c.status === "running")
  const noun = items.length === 1 ? "tool" : "tools"

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[13px] text-ui-caption transition-colors hover:text-ui-heading"
      >
        {icon}
        {running ? `Using ${items.length} ${noun}…` : `${items.length} ${noun} used`}
        <ChevronRight aria-hidden className={cn("size-3.5 transition-transform", open && "rotate-90")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {items.map((call, i) => (
              <li key={`${call.name}-${i}`} className="flex items-start gap-2 py-1 pl-6 text-[13px] text-ui-secondary">
                <span className="mt-0.5">
                  <StatusIcon status={call.status} />
                </span>
                <span className="flex min-w-0 flex-col">
                  {call.name}
                  {call.detail && <span className="truncate text-[12px] text-ui-hint">{call.detail}</span>}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
