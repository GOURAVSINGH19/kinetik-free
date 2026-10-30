"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { DEMO_REPLY } from "./defaults"
import type { QuickChatMessage, QuickChatProps, QuickChatResult, QuickChatSession } from "./types"

let nextId = 0
export const uid = () => `qc-${++nextId}`

/** State that follows a prop when one is passed, and keeps its own copy otherwise. */
export function useControllable<T>(prop: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [own, setOwn] = useState(initial)
  const value = prop ?? own
  const set = useCallback(
    (next: T) => {
      setOwn(next)
      onChange?.(next)
    },
    [onChange],
  )
  return [value, set] as const
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const id = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => (clearTimeout(id), resolve()), { once: true })
  })

function isStream(value: unknown): value is AsyncIterable<string> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value
}

/** Turns a whole reply into chunks of a few words, so it arrives like a stream. */
async function* wordsOf(text: string, signal: AbortSignal, instant: boolean): AsyncGenerator<string> {
  if (instant) {
    yield text
    return
  }
  const parts = text.split(/(\s+)/)
  for (let i = 0; i < parts.length && !signal.aborted; i += 4) {
    yield parts.slice(i, i + 4).join("")
    await sleep(36, signal)
  }
}

type SendExtras = { model: string; thinking: boolean; attachments: File[] }

/**
 * The conversation: messages, sending, streaming, Stop and Retry. Each send gets its own
 * AbortController, so Stop really cancels the caller's request instead of ignoring it.
 */
export function useChat(onSend: QuickChatProps["onSend"], reduceMotion: boolean) {
  const [messages, setMessages] = useState<QuickChatMessage[]>([])
  const controller = useRef<AbortController | null>(null)
  const busy = messages.some((m) => m.status === "pending" || m.status === "streaming")

  const patch = (id: string, change: Partial<QuickChatMessage> | ((m: QuickChatMessage) => Partial<QuickChatMessage>)) =>
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, ...(typeof change === "function" ? change(m) : change) } : m)))

  async function run(text: string, history: QuickChatMessage[], extras: SendExtras) {
    controller.current?.abort()
    const ctrl = new AbortController()
    controller.current = ctrl
    const id = uid()
    setMessages([...history, { id, role: "assistant", text: "", status: "pending" }])

    try {
      const result: QuickChatResult = onSend
        ? await onSend(text, { history, ...extras, signal: ctrl.signal })
        : await sleep(900, ctrl.signal).then(() => DEMO_REPLY)
      if (ctrl.signal.aborted) return

      let chunks: AsyncIterable<string>
      if (isStream(result)) chunks = result
      else {
        const reply = typeof result === "string" ? { text: result } : result
        patch(id, { tools: reply.tools })
        chunks = wordsOf(reply.text, ctrl.signal, reduceMotion)
      }

      for await (const chunk of chunks) {
        if (ctrl.signal.aborted) break
        patch(id, (m) => ({ text: m.text + chunk, status: "streaming" }))
      }
      if (!ctrl.signal.aborted) patch(id, { status: "done" })
    } catch (error) {
      if (ctrl.signal.aborted) return
      patch(id, { text: error instanceof Error ? error.message : "Something went wrong.", status: "error" })
    }
  }

  function send(text: string, extras: SendExtras) {
    const history: QuickChatMessage[] = [
      ...messages,
      {
        id: uid(),
        role: "user",
        text,
        attachments: extras.attachments.map((f) => ({ name: f.name, size: f.size })),
        status: "done",
      },
    ]
    void run(text, history, extras)
  }

  function retry(extras: SendExtras) {
    const index = messages.findLastIndex((m) => m.role === "user")
    if (index < 0) return
    void run(messages[index]!.text, messages.slice(0, index + 1), extras)
  }

  /** Keeps whatever already arrived, marks it stopped, and drops a reply that never started. */
  function stop() {
    controller.current?.abort()
    setMessages((all) =>
      all.flatMap((m) =>
        m.status === "pending" ? [] : m.status === "streaming" ? [{ ...m, status: "stopped" as const }] : [m],
      ),
    )
  }

  function reset() {
    controller.current?.abort()
    setMessages([])
  }

  /** Opens a saved chat. A reply that was cut off mid-stream shows as stopped. */
  function load(saved: QuickChatMessage[]) {
    controller.current?.abort()
    setMessages(
      saved
        .filter((m) => m.status !== "pending")
        .map((m) => (m.status === "streaming" ? { ...m, status: "stopped" as const } : m)),
    )
  }

  useEffect(() => () => controller.current?.abort(), [])

  return { messages, busy, send, retry, stop, reset, load }
}

/**
 * Follows new content while the reader is at the bottom, and leaves them alone once they
 * scroll up to read something earlier.
 */
export function useStickToBottom(ref: RefObject<HTMLElement | null>, deps: unknown) {
  const stuck = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [ref])

  useLayoutEffect(() => {
    const el = ref.current
    if (el && stuck.current) el.scrollTop = el.scrollHeight
  }, [ref, deps])

  return () => {
    stuck.current = true
  }
}

/**
 * Drag-to-resize for the panel. Width grows leftwards (the panel is anchored right),
 * height grows downwards. Arrow keys on the handle resize in 16px steps.
 */
export function useResize(initial: { width: number; height: number }, axes: "x" | "xy") {
  const [size, setSize] = useState(initial)
  const [resizing, setResizing] = useState(false)

  const clamp = (width: number, height: number) => ({
    width: Math.min(Math.max(width, 360), Math.max(360, window.innerWidth - 32)),
    height: Math.min(Math.max(height, 380), Math.max(380, window.innerHeight - 32)),
  })

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const start = size
    setResizing(true)
    const move = (e: PointerEvent) =>
      setSize(clamp(start.width + startX - e.clientX, axes === "xy" ? start.height + e.clientY - startY : start.height))
    const up = () => {
      setResizing(false)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 64 : 16
    const dx = event.key === "ArrowLeft" ? step : event.key === "ArrowRight" ? -step : 0
    const dy = axes === "xy" ? (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0) : 0
    if (!dx && !dy) return
    event.preventDefault()
    setSize((s) => clamp(s.width + dx, s.height + dy))
  }

  return { size, resizing, handleProps: { onPointerDown, onKeyDown } }
}


/**
 * Saved chats, newest first. Filled after mount — from localStorage when `storageKey` has some,
 * otherwise from `initial` — so the server and the first client render agree, and a function
 * `initial` (one that reads the clock, say) only ever runs in the browser. Changes go to
 * `onChange` and, with a key, back to storage, but only once a reply has finished.
 */
export function useHistory(
  initial: QuickChatSession[] | (() => QuickChatSession[]),
  onChange: ((sessions: QuickChatSession[]) => void) | undefined,
  storageKey: string | undefined,
  busy: boolean,
) {
  const [sessions, setSessions] = useState<QuickChatSession[]>(() => (typeof initial === "function" ? [] : initial))
  const ready = useRef(false)
  const initialRef = useRef(initial)

  useEffect(() => {
    let stored: QuickChatSession[] | null = null
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) stored = JSON.parse(raw) as QuickChatSession[]
      } catch {
        // Private mode or bad JSON: fall back to `initial`.
      }
    }
    const seed = initialRef.current
    if (stored) setSessions(stored)
    else if (typeof seed === "function") setSessions(seed())
    ready.current = true
  }, [storageKey])

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    if (busy || !ready.current) return
    onChangeRef.current?.(sessions)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sessions))
      } catch {
        // Storage full or blocked; the in-memory list still works.
      }
    }
  }, [sessions, busy, storageKey])

  const save = useCallback((session: QuickChatSession) => {
    setSessions((all) => [session, ...all.filter((s) => s.id !== session.id)].sort((a, b) => b.createdAt - a.createdAt))
  }, [])

  const remove = useCallback((id: string) => setSessions((all) => all.filter((s) => s.id !== id)), [])

  return { sessions, save, remove }
}
