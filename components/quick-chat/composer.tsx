"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, AtSign, FileText, Plus, Square, X } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { cn } from "@/lib/utils"
import { DictationButton, useDictation } from "@/components/dictation/index"
import { useMentions } from "@/components/mention-input/index"
import { ModelSelector, TOOLBAR_TRIGGER } from "@/components/model-selector/index"
import { AddMenu } from "./add-menu"
import { uid } from "./hooks"
import { IconButton } from "./parts"
import { POP, type QuickChatAttachment, type QuickChatMention, type QuickChatModel } from "./types"

export const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`

function AttachmentChip({ attachment, onRemove }: { attachment: QuickChatAttachment; onRemove: () => void }) {
  const { file, previewUrl } = attachment
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={POP}
      className="group/chip relative flex h-11 max-w-48 items-center gap-2 rounded-lg border border-ui-border bg-ui-bg py-1 pr-2 pl-1"
    >
      {previewUrl ? (
        <img src={previewUrl} alt="" className="size-9 rounded-md object-cover" />
      ) : (
        <span className="grid size-9 place-items-center rounded-md bg-ui-muted text-ui-caption">
          <FileText className="size-4" />
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[12.5px] text-ui-heading">{file.name}</span>
        <span className="text-[11px] text-ui-caption">{formatSize(file.size)}</span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-ui-inverse text-ui-on-inverse opacity-0 transition-opacity group-hover/chip:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-2.5" strokeWidth={3} />
      </button>
    </motion.li>
  )
}

/**
 * The message box: text, attachments, and a toolbar built from the library's own pieces —
 * Mention Input's `useMentions`, Model Selector and Dictation.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder,
  textareaRef,
  mentions,
  models,
  model,
  onModelChange,
  thinking,
  onThinkingChange,
  attachments: allowAttachments,
  dictation: allowDictation,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (files: File[]) => void
  onStop: () => void
  busy: boolean
  placeholder: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  mentions: QuickChatMention[]
  models: QuickChatModel[]
  model: string
  onModelChange: (id: string) => void
  thinking: boolean
  onThinkingChange: (on: boolean) => void
  attachments: boolean
  dictation: boolean
}) {
  const ref = textareaRef
  const fileInput = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [files, setFiles] = useState<QuickChatAttachment[]>([])
  const [dragging, setDragging] = useState(false)

  const mention = useMentions({ mentions, value, onChange, textareaRef: ref })
  // Same voice input as Prompt Input: words land in the box live, after what was already typed.
  const base = useRef("")
  const before = useRef("")
  const dictation = useDictation(allowDictation, (transcript) => onChange(base.current + transcript))
  const toggleDictation = () => {
    if (!dictation.listening) {
      before.current = value
      base.current = value ? `${value.trimEnd()} ` : ""
    }
    dictation.toggle()
    ref.current?.focus()
  }
  // ✕ while listening: stop and put back exactly what was there before the mic went on.
  const cancelDictation = () => {
    dictation.cancel()
    onChange(before.current)
    ref.current?.focus()
  }
  const canSend = (value.trim().length > 0 || files.length > 0) && !busy

  // Grow with the text up to about six lines, then scroll. Re-measure when the width
  // changes too, since layouts and resizing move where lines wrap.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 168)}px`
    }
    fit()
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      fit()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, value])

  // Object URLs for image previews are released when a chip goes away or on unmount.
  const filesRef = useRef(files)
  filesRef.current = files
  useEffect(() => () => filesRef.current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl)), [])

  function addFiles(list: Iterable<File>) {
    if (!allowAttachments) return
    const added = [...list].map((file) => ({
      id: uid(),
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))
    if (added.length) setFiles((f) => [...f, ...added])
  }

  function removeFile(id: string) {
    setFiles((all) => {
      const gone = all.find((f) => f.id === id)
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl)
      return all.filter((f) => f.id !== id)
    })
  }

  function submit() {
    if (!canSend) return
    if (dictation.listening) dictation.stop()
    onSubmit(files.map((f) => f.file))
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl))
    setFiles([])
    mention.close()
  }

  function startMention() {
    setAddOpen(false)
    mention.start()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.focus()
      }}
      onDragOver={(event) => {
        if (!allowAttachments || !event.dataTransfer.types.includes("Files")) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={(event) => {
        if (!allowAttachments) return
        event.preventDefault()
        setDragging(false)
        addFiles(event.dataTransfer.files)
      }}
      className={cn(
        // A size container, so the toolbar labels fold away when the composer itself is narrow.
        "@container relative flex w-full flex-col gap-3 rounded-xl border border-ui-border bg-ui-subtle p-2.5",
        "shadow-[0_1px_2px_rgb(0_0_0/0.08),0_6px_20px_-6px_rgb(0_0_0/0.18)] transition-shadow",
        "focus-within:border-ui-border-strong focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ui-accent)_18%,transparent),0_6px_20px_-6px_rgb(0_0_0/0.18)]",
        dragging && "border-dashed border-ui-accent",
      )}
    >
      {mention.menu}

      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            aria-label="Attachments"
            className="flex flex-wrap gap-2 px-0.5 pt-0.5"
          >
            <AnimatePresence initial={false}>
              {files.map((f) => (
                <AttachmentChip key={f.id} attachment={f} onRemove={() => removeFile(f.id)} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>

      <textarea
        ref={ref}
        rows={1}
        value={value}
        aria-label="Message"
        {...mention.ariaProps}
        placeholder={dragging ? "Drop files to attach" : placeholder}
        onChange={(event) => {
          onChange(event.target.value)
          mention.onChange(event)
        }}
        onSelect={mention.onSelect}
        onKeyDown={(event) => {
          if (mention.onKeyDown(event)) return
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit()
          }
        }}
        onPaste={(event) => {
          const pasted = [...event.clipboardData.files]
          if (!allowAttachments || !pasted.length) return
          event.preventDefault()
          addFiles(pasted)
        }}
        className="min-h-7 w-full resize-none bg-transparent px-1 text-[14px] leading-7 text-ui-heading outline-none placeholder:text-ui-hint"
      />

      <div className="flex items-center gap-1">
        <IconButton buttonRef={addRef} label="Add" active={addOpen} onClick={() => setAddOpen((v) => !v)}>
          <Plus className={cn("size-4 transition-transform", addOpen && "rotate-45")} />
        </IconButton>
        <AddMenu
          open={addOpen}
          onClose={() => setAddOpen(false)}
          anchorRef={addRef}
          onUpload={
            allowAttachments
              ? () => {
                  setAddOpen(false)
                  fileInput.current?.click()
                }
              : undefined
          }
          onMention={mentions.length ? startMention : undefined}
        />
        {mentions.length > 0 && (
          <IconButton label="Mention" active={mention.open} onClick={startMention}>
            <AtSign className="size-4" />
          </IconButton>
        )}

        {models.length > 0 && <span aria-hidden className="mx-1 h-4 w-px bg-ui-border" />}

        {models.length > 0 && (
          // `static` lets the menu position against the composer, so it lines up with it
          // instead of hanging off the pill's left edge past the panel.
          <ModelSelector
            models={models}
            value={model}
            onValueChange={onModelChange}
            thinking={thinking}
            onThinkingChange={onThinkingChange}
            size="sm"
            side="top"
            label="Choose model"
            className="static min-w-0"
            triggerClassName={TOOLBAR_TRIGGER}
          />
        )}

        <div className="ml-auto flex items-center gap-1">
          <DictationButton
            supported={dictation.supported}
            listening={dictation.listening}
            onToggle={toggleDictation}
            onCancel={cancelDictation}
            className="h-7 min-w-7 rounded-md px-1.5"
          />
          <motion.button
            type={busy ? "button" : "submit"}
            aria-label={busy ? "Stop" : "Send"}
            onClick={busy ? onStop : undefined}
            disabled={!busy && !canSend}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "grid size-7 place-items-center rounded-md transition-colors",
              canSend || busy ? "bg-ui-inverse text-ui-on-inverse" : "bg-ui-muted text-ui-hint",
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={busy ? "stop" : "send"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={POP}
              >
                {busy ? <Square className="size-3 fill-current" /> : <ArrowUp className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </form>
  )
}
