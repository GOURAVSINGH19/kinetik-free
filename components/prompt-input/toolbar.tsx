"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUp, Square } from "lucide-react"
import { useEffect, useState } from "react"
import { DictationButton } from "@/components/dictation/index"
import { ModelSelector } from "../model-selector/model-selector"
import { TOOLBAR_TRIGGER } from "../model-selector/types"
import { AddMenu, ToolChip } from "./add-menu"
import { BLUR_IN, BLUR_SHOWN, POP_SPRING, type PromptModel, type PromptTool } from "./types"

const enter = { variants: { hidden: BLUR_IN, shown: BLUR_SHOWN } }

/** Arrow to run; morphs into a stop square while running. */
export function RunButton({ running, disabled, onClick }: { running: boolean; disabled: boolean; onClick: () => void }) {
  const reduce = useReducedMotion()
  const spring = reduce ? { duration: 0 } : POP_SPRING
  return (
    <motion.button
      type="button"
      aria-label={running ? "Stop" : "Run"}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      {...enter}
      transition={spring}
      className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-ui-inverse text-ui-on-inverse outline-none focus-visible:ring-2 focus-visible:ring-ui-accent/60 disabled:cursor-default disabled:bg-ui-emphasis disabled:text-ui-hint"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={running ? "stop" : "run"}
          initial={{ opacity: 0, scale: 0.4, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.4, filter: "blur(6px)" }}
          transition={spring}
          className="flex"
        >
          {running ? <Square className="size-3 fill-current" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

export type ToolbarProps = {
  show: boolean
  models: PromptModel[]
  model: string
  onModel: (id: string) => void
  tools: PromptTool[]
  tool: string | null
  onTool: (id: string | null) => void
  onAttach: (kind: "camera" | "file") => void
  voice?: { listening: boolean; onToggle: () => void; onCancel?: () => void }
  running: boolean
  canRun: boolean
  onRun: () => void
}

/** The row under the text: + menu, tool chip and model on the left, mic + run on the right. Items blur in one by one. */
export function Toolbar({ show, models, model, onModel, tools, tool, onTool, onAttach, voice, running, canRun, onRun }: ToolbarProps) {
  const reduce = useReducedMotion()
  const spring = reduce ? { duration: 0 } : POP_SPRING
  const item = { variants: { hidden: BLUR_IN, shown: BLUR_SHOWN }, transition: spring }

  // Clipped while it grows or folds, so nothing spills under the box as its width changes, and
  // unclipped once fully open so the + menu and model list can open past the edge. Driven by
  // state: Framer's transitionEnd doesn't reliably fire after a height: "auto" spring.
  const [opened, setOpened] = useState(false)
  useEffect(() => {
    if (!show) setOpened(false)
  }, [show])

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="toolbar"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0, transition: { duration: reduce ? 0 : 0.16, ease: [0.4, 0, 1, 1] } }}
          transition={spring}
          onAnimationStart={() => setOpened(false)}
          onAnimationComplete={() => show && setOpened(true)}
          style={{ overflow: opened ? "visible" : "hidden" }}
        >
          <motion.div
            className="flex items-center gap-1.5 px-3 pb-3 whitespace-nowrap [&>*]:shrink-0"
            initial="hidden"
            animate="shown"
            exit="hidden"
            variants={{
              // In: wait for the width to open, then stagger. Out: all at once, quickly.
              shown: { transition: { delayChildren: reduce ? 0 : 0.08, staggerChildren: reduce ? 0 : 0.05 } },
              hidden: { transition: { duration: 0.12 } },
            }}
          >
            <motion.div {...item}>
              <AddMenu tools={tools} tool={tool} onTool={onTool} onAttach={onAttach} />
            </motion.div>
            {/* empty:hidden keeps the row's gap from doubling when no tool is on. */}
            <motion.div {...item} className="empty:hidden">
              <ToolChip tool={tools.find((t) => t.id === tool)} onClear={() => onTool(null)} />
            </motion.div>
            <motion.div {...item}>
              <ModelSelector
                models={models}
                value={model}
                onValueChange={onModel}
                label="Choose model"
                triggerClassName={TOOLBAR_TRIGGER}
              />
            </motion.div>

            <div className="flex-1" />

            {voice && (
              <motion.div {...item}>
                <DictationButton listening={voice.listening} onToggle={voice.onToggle} onCancel={voice.onCancel} />
              </motion.div>
            )}
            <RunButton running={running} disabled={!canRun} onClick={onRun} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
