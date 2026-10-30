import {
  AiBrain01Icon,
  CpuIcon,
  DatabaseIcon,
  FlashIcon,
  Image01Icon,
  Invoice01Icon,
  Search01Icon,
  SparklesIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import type { QuickChatMention, QuickChatModel, QuickChatReply } from "./types"

/** A plain line icon that takes its size and colour from the neutral tile it sits in. */
const icon = (svg: IconSvgElement) => <HugeiconsIcon icon={svg} strokeWidth={1.75} />

// Sample data so the chat works with zero setup. Pass your own lists to replace it.
// No colours: each icon sits in a quiet neutral tile that follows the theme.

export const DEFAULT_MENTIONS: QuickChatMention[] = [
  { id: "rune", name: "Rune", description: "CRM assistant", kind: "agent", icon: icon(SparklesIcon) },
  { id: "aether", name: "Aether", description: "Research", kind: "agent", icon: icon(Search01Icon) },
  { id: "syntax", name: "Syntax", description: "Data & reports", kind: "agent", icon: icon(DatabaseIcon) },
  { id: "theo", name: "Theo", description: "Billing", kind: "agent", icon: icon(Invoice01Icon) },
  { id: "jane", name: "Jane Moore", description: "Workspace admin", kind: "person" },
  { id: "veronica", name: "Veronica Han", description: "Sales lead", kind: "person" },
  { id: "john", name: "John Harry", description: "Account manager", kind: "person" },
]

export const DEFAULT_MODELS: QuickChatModel[] = [
  { id: "opus", name: "Claude Opus", description: "Best for hard questions", badge: "New", glyph: icon(AiBrain01Icon) },
  { id: "sonnet", name: "Claude Sonnet", description: "Fast and balanced", glyph: icon(SparklesIcon) },
  { id: "gpt", name: "GPT-6", description: "General purpose", glyph: icon(CpuIcon) },
  { id: "gemini", name: "Gemini Ultra", description: "Long documents and images", glyph: icon(Image01Icon) },
  { id: "flash", name: "Flash", description: "Quickest answers", glyph: icon(FlashIcon) },
  { id: "code", name: "Codex", description: "Code and formulas", glyph: icon(SourceCodeIcon) },
]

export const DEMO_REPLY: QuickChatReply = {
  text: "Vertex Systems and NexGen Solutions lead with 500–1000 employees each. Heritage Manufacturing, Synergy Tech and Elevate Digital follow at 200–500.",
  tools: ["Searched customers", "Sorted by employees"],
}
