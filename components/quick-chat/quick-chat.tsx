"use client"

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Composer } from "./composer"
import { DEFAULT_MENTIONS, DEFAULT_MODELS } from "./defaults"
import { Header } from "./header"
import { uid, useChat, useControllable, useHistory, useResize, useStickToBottom } from "./hooks"
import { HistoryView } from "./history"
import { MessageRow } from "./parts"
import { SPRING, type QuickChatLayout, type QuickChatProps, type QuickChatSession } from "./types"

function EmptyState({
  agentName,
  description,
  suggestions,
  onPick,
}: {
  agentName: string
  description: string
  suggestions: string[]
  onPick: (text: string) => void
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      transition={{ duration: 0.25 }}
      className="m-auto flex max-w-xs flex-col items-center px-6 py-8 text-center"
    >
      <h2 className="mt-4 font-serif text-2xl leading-tight text-ui-heading">New chat with {agentName}</h2>
      <p className="mt-2 text-[13px] leading-5 text-ui-caption">{description}</p>
      {suggestions.length > 0 && (
        <ul className="mt-6 flex flex-wrap justify-center gap-1.5">
          {suggestions.map((s, i) => (
            <motion.li
              key={s}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05, ...SPRING }}
            >
              <button
                type="button"
                onClick={() => onPick(s)}
                className="rounded-full border border-ui-border bg-ui-subtle px-3 py-1.5 text-[12.5px] text-ui-secondary transition-colors hover:border-ui-border-strong hover:text-ui-heading"
              >
                {s}
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

/** The grip on the panel's resizable edge or corner. Focusable, and arrow keys resize too. */
function ResizeHandle({
  kind,
  props,
}: {
  kind: "edge" | "corner"
  props: { onPointerDown: (e: React.PointerEvent) => void; onKeyDown: (e: React.KeyboardEvent) => void }
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize chat"
      tabIndex={0}
      {...props}
      className={cn(
        "absolute z-20 touch-none outline-none focus-visible:bg-ui-accent/30",
        kind === "edge"
          ? "inset-y-0 left-0 w-1.5 cursor-ew-resize hover:bg-ui-accent/20"
          : "bottom-0 left-0 grid size-4 cursor-nesw-resize place-items-center rounded-tr text-ui-hint hover:text-ui-heading",
      )}
    >
      {kind === "corner" && (
        <svg aria-hidden viewBox="0 0 12 12" className="size-3 -scale-x-100">
          <path d="M11 4 4 11M11 8 8 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

export function QuickChat({
  agentName = "Rune",
  description = "Ask anything about your customers, contracts or reports.",
  placeholder = "Example: Search…",
  suggestions = ["Top customers by size", "Contracts renewing this month", "Summarise last week"],
  onSend,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  layout: layoutProp,
  defaultLayout = "popup",
  onLayoutChange,
  mentions = DEFAULT_MENTIONS,
  models = DEFAULT_MODELS,
  defaultModel,
  defaultThinking = false,
  attachments = true,
  dictation = true,
  defaultHistory = [],
  onHistoryChange,
  storageKey,
  closable = true,
  className,
}: QuickChatProps) {
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [layout, setLayout] = useControllable(layoutProp, defaultLayout, onLayoutChange)
  const [model, setModel] = useState(defaultModel ?? models[0]?.id ?? "")
  const [thinking, setThinking] = useState(defaultThinking)
  // Where "restore" goes back to after minimizing.
  const lastLayout = useRef<Exclude<QuickChatLayout, "minimized">>(defaultLayout === "minimized" ? "popup" : defaultLayout)

  const { messages, busy, send, retry, stop, reset, load } = useChat(onSend, reduce)
  const history = useHistory(defaultHistory, onHistoryChange, storageKey, busy)
  const [view, setView] = useState<"chat" | "history">("chat")
  // The saved chat on screen; null until the first message of a new chat.
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = useRef<{ id: string; createdAt: number } | null>(null)
  const [draft, setDraft] = useState("")
  const textarea = useRef<HTMLTextAreaElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const last = messages.at(-1)
  const follow = useStickToBottom(scroller, `${messages.length}:${last?.text.length}:${last?.status}`)

  const popup = useResize({ width: 500, height: 720 }, "xy")
  const drawer = useResize({ width: 440, height: 0 }, "x")
  const [scope, animate] = useAnimate<HTMLElement>()

  const title = messages.find((m) => m.role === "user")?.text || "New chat"


  useEffect(() => {
    if (!messages.length) return
    if (!active.current) {
      active.current = { id: uid(), createdAt: Date.now() }
      setActiveId(active.current.id)
    }
    history.save({ ...active.current, title, updatedAt: Date.now(), messages })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  function newChat() {
    reset()
    setDraft("")
    active.current = null
    setActiveId(null)
    setView("chat")
  }

  function openSession(session: QuickChatSession) {
    if (session.id !== active.current?.id) {
      active.current = { id: session.id, createdAt: session.createdAt }
      setActiveId(session.id)
      load(session.messages)
      setDraft("")
    }
    setView("chat")
    requestAnimationFrame(() => textarea.current?.focus({ preventScroll: true }))
  }

  function deleteSession(id: string) {
    history.remove(id)
    if (id === active.current?.id) {
      reset()
      active.current = null
      setActiveId(null)
    }
  }
  const extras = (files: File[] = []) => ({ model, thinking, attachments: files })

  function submit(text: string, files: File[] = []) {
    const clean = text.trim()
    if ((!clean && !files.length) || busy) return
    follow()
    send(clean, extras(files))
    setDraft("")
  }

  function changeLayout(next: QuickChatLayout) {
    if (next !== "minimized") lastLayout.current = next
    setLayout(next)
  }

  useEffect(() => {
    if (!scope.current) return
    if (!reduce) void animate(scope.current, { opacity: [0.4, 1], scale: [0.985, 1] }, { duration: 0.22 })
    if (layout !== "minimized") textarea.current?.focus({ preventScroll: true })
  }, [layout])

  useEffect(() => {
    if (!open) stop()
  }, [open])

  const minimized = layout === "minimized"
  const size =
    layout === "popup"
      ? { width: popup.size.width, height: popup.size.height }
      : layout === "drawer"
        ? { width: drawer.size.width }
        : undefined

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          ref={scope}
          aria-label={`Chat with ${agentName}`}
          data-layout={layout}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
          transition={SPRING}
          style={size}
          onKeyDown={(event) => {
            if (event.key === "Escape" && closable && !event.defaultPrevented) setOpen(false)
          }}
          className={cn(
            "z-20 flex flex-col overflow-hidden border border-ui-border bg-ui-bg",
            layout === "popup" &&
            "absolute top-2 right-2 max-h-[calc(100%-16px)] max-w-[calc(100%-16px)] rounded-[10px] shadow-[-10px_0_60px_-20px_rgb(0_0_0/0.3),0_24px_48px_-12px_rgb(0_0_0/0.25)]",
            layout === "drawer" && "relative h-full max-w-[85%] shrink-0 border-y-0 border-r-0",
            layout === "full" && "absolute inset-0 border-0",
            minimized && "absolute right-3 bottom-3 w-[340px] max-w-[calc(100%-24px)] rounded-[10px] shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35)]",
            (popup.resizing || drawer.resizing) && "select-none",
            className,
          )}
        >
          <Header
            title={title}
            view={view}
            layout={layout}
            historyCount={history.sessions.length}
            onLayout={changeLayout}
            onRestore={() => changeLayout(lastLayout.current)}
            onHistory={() => setView((v) => (v === "history" ? "chat" : "history"))}
            onNew={messages.length || view === "history" ? newChat : undefined}
            onClose={closable ? () => setOpen(false) : undefined}
          />

          {view === "history" && !minimized && (
            <HistoryView sessions={history.sessions} activeId={activeId} onOpen={openSession} onDelete={deleteSession} />
          )}

          <div hidden={minimized || view === "history"} className="flex min-h-0 flex-1 flex-col">
            <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <AnimatePresence mode="popLayout" initial={false}>
                {messages.length === 0 ? (
                  <EmptyState
                    key="empty"
                    agentName={agentName}
                    description={description}
                    suggestions={suggestions}
                    onPick={(s) => submit(s)}
                  />
                ) : (
                  <motion.ol
                    key="thread"
                    aria-label="Conversation"
                    aria-busy={busy}
                    className={cn(
                      "mx-auto flex w-full flex-col gap-6 px-5 py-5",
                      layout === "full" ? "max-w-[720px]" : "max-w-[640px]",
                    )}
                  >
                    {messages.map((m, i) => (
                      <MessageRow
                        key={m.id}
                        message={m}
                        onRetry={m.role === "assistant" && i === messages.length - 1 ? () => retry(extras()) : undefined}
                      />
                    ))}
                  </motion.ol>
                )}
              </AnimatePresence>
            </div>

            <div className={cn("mx-auto w-full shrink-0 p-4 pt-2", layout === "full" && "max-w-[752px] pb-8")}>
              <Composer
                value={draft}
                onChange={setDraft}
                onSubmit={(files) => submit(draft, files)}
                onStop={stop}
                busy={busy}
                placeholder={placeholder}
                textareaRef={textarea}
                mentions={mentions}
                models={models}
                model={model}
                onModelChange={setModel}
                thinking={thinking}
                onThinkingChange={setThinking}
                attachments={attachments}
                dictation={dictation}
              />
            </div>
          </div>

          {layout === "popup" && <ResizeHandle kind="corner" props={popup.handleProps} />}
          {layout === "drawer" && <ResizeHandle kind="edge" props={drawer.handleProps} />}

          <p aria-live="polite" className="sr-only">
            {last?.role === "assistant" && last.status === "done" ? last.text : ""}
          </p>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
