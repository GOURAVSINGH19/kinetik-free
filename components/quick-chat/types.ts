import type { Mention } from "@/components/mention-input/index"
import type { ModelOption } from "@/components/model-selector/index"

export type QuickChatLayout ="popup" | "drawer" | "full" | "minimized"

export type QuickChatReply = {
  text: string
  /** Names of the tools the agent ran, shown in a collapsible "N tools used" row. */
  tools?: string[]
}

/**
 * What `onSend` may return: a whole reply, or an async iterable of text chunks for a real
 * stream (for example from `fetch` + `TextDecoderStream`). Whole replies are revealed a few
 * words at a time so both feel the same.
 */
export type QuickChatResult = string | QuickChatReply | AsyncIterable<string>

export type QuickChatAttachment = { id: string; file: File; previewUrl?: string }

export type QuickChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  tools?: string[]
  attachments?: { name: string; size: number }[]
  /** pending: waiting for the first chunk. stopped: the user pressed Stop mid-reply. */
  status?: "pending" | "streaming" | "done" | "stopped" | "error"
}

/** A saved conversation, listed in the History view. */
export type QuickChatSession = {
  id: string
  /** The first message, used as the chat's name. */
  title: string
  /** When the chat was started (ms since epoch). History is sorted and filtered by this. */
  createdAt: number
  updatedAt: number
  messages: QuickChatMessage[]
}

export type QuickChatSendContext = {
  history: QuickChatMessage[]
  /** Id of the model picked in the composer. */
  model: string
  /** Whether "Extended thinking" is on in the model menu. */
  thinking: boolean
  attachments: File[]
  /** Aborted when the user presses Stop, starts a new chat or closes the panel. */
  signal: AbortSignal
}

// The pieces come from their own components; these names keep Quick Chat's API readable.
export type QuickChatMention = Mention
export type QuickChatModel = ModelOption

export type QuickChatProps = {
  /** Shown in the breadcrumb and the empty state. */
  agentName?: string
  /** Line under the empty-state heading. */
  description?: string
  placeholder?: string
  /** Prompts offered as chips before the first message. */
  suggestions?: string[]
  /** Answers a message. Omit for a canned demo reply. */
  onSend?: (text: string, context: QuickChatSendContext) => QuickChatResult | Promise<QuickChatResult>

  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void

  layout?: QuickChatLayout
  defaultLayout?: QuickChatLayout
  onLayoutChange?: (layout: QuickChatLayout) => void


  /** Agents and people offered by @ and the mention button. Pass [] to turn mentions off. */
  mentions?: QuickChatMention[]
  /** Offered by the composer's Model Selector. Pass [] to hide it. */
  models?: QuickChatModel[]
  /** Picked at start. Defaults to the first model. */
  defaultModel?: string
  /** Starts with "Extended thinking" on in the model menu. */
  defaultThinking?: boolean
  /** Lets people attach files from the + menu. */
  attachments?: boolean
  /** Shows the mic when the browser supports speech recognition. */
  dictation?: boolean
  /**
   * Past chats to start with, shown in the History view. Pass a function to build them in the
   * browser only, for example when they're dated relative to now.
   */
  defaultHistory?: QuickChatSession[] | (() => QuickChatSession[])
  /** Called whenever a chat is saved or deleted, so you can store the list yourself. */
  onHistoryChange?: (sessions: QuickChatSession[]) => void
  /** Saves history in localStorage under this key, so it survives a reload. */
  storageKey?: string
  /** Hides the close button when false. */
  closable?: boolean
  className?: string
}

export const SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 } as const
export const POP = { type: "spring", stiffness: 560, damping: 34, mass: 0.6 } as const

/** Petal colours for the agent glyph, going round the flower. */
export const PETALS = ["#ff5e3a", "#ff9f1c", "#ffd60a", "#34c759", "#22b8cf", "#3a86ff", "#8e5cff", "#ff4fa3"]
