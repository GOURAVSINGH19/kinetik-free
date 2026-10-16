"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/button/button"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  /** Label of the confirming button. */
  confirmLabel?: string
  /** Ask the reader to type this word before the confirm button works, for the riskiest actions. */
  typeToConfirm?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A modal that asks before a destructive action. A native <dialog>, so focus stays inside it,
 * Escape and a click on the backdrop cancel, and focus returns to where it was. Cancel is focused
 * first, so a stray Enter never deletes anything.
 */
export function ConfirmDialog({ open, title, description, confirmLabel = "Delete", typeToConfirm, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const inputId = useId()
  const [typed, setTyped] = useState("")
  const ready = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm.toLowerCase()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setTyped("")
      dialog.showModal()
      cancelRef.current?.focus()
      // A short blur-and-scale in; reduced motion just appears.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        dialog.animate(
          [
            { opacity: 0, transform: "scale(0.96)", filter: "blur(4px)" },
            { opacity: 1, transform: "none", filter: "blur(0px)" },
          ],
          { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        )
      }
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape fires `cancel`: let the parent close it, so `open` stays the source of truth.
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onCancel()
      }}
      className={cn(
        "m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-ui-border bg-ui-bg p-0 text-ui-body shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]",
        "backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      )}
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault()
          if (ready) onConfirm()
        }}
        className="flex flex-col gap-4 p-5"
      >
        <div className="flex gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-base font-semibold text-ui-heading">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ui-caption">
                {description}
              </p>
            )}
          </div>
        </div>

        {typeToConfirm && (
          <label htmlFor={inputId} className="flex flex-col gap-1.5 text-sm text-ui-body">
            <span>
              Type <strong className="font-mono font-medium text-ui-heading">{typeToConfirm}</strong> to confirm.
            </span>
            <input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="h-9 rounded-md border border-ui-border bg-ui-bg px-3 font-mono text-sm text-ui-heading outline-none focus-visible:ring-2 focus-visible:ring-ui-border-strong"
            />
          </label>
        )}

        <div className="flex justify-end gap-2">
          <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={!ready}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
