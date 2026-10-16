"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { MenuPanel } from "./menu-panel"
import { MOTION, type MenubarProps } from "./types"

export function Menubar({ menus, label = "Menu", className }: MenubarProps) {
  const [open, setOpen] = useState(-1)
  // `session` restarts submenus on every open; `focusKey` asks the menu to focus its first item.
  const [session, setSession] = useState(0)
  const [focusKey, setFocusKey] = useState(0)
  const [tabStop, setTabStop] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])
  const panelRefs = useRef<Array<HTMLDivElement | null>>([])

  // A light pill slides between triggers as you hover or move with the keyboard.
  const glide = (index: number) => {
    const glow = glowRef.current
    const trigger = triggerRefs.current[index]
    if (!glow) return
    if (!trigger) {
      glow.style.opacity = "0"
      return
    }
    glow.style.transform = `translateX(${trigger.offsetLeft}px)`
    glow.style.width = `${trigger.offsetWidth}px`
    glow.style.opacity = "1"
  }

  const show = (index: number, fromKeyboard = false) => {
    const trigger = triggerRefs.current[index]
    const panel = panelRefs.current[index]
    // Each menu sits under its trigger and grows out of the trigger's centre.
    if (trigger && panel) {
      panel.style.left = `${trigger.offsetLeft}px`
      const menu = panel.firstElementChild as HTMLElement | null
      if (menu) menu.style.transformOrigin = `${trigger.offsetWidth / 2}px -8px`
    }
    if (index !== open) setSession((s) => s + 1)
    setOpen(index)
    setTabStop(index)
    if (fromKeyboard) setFocusKey(Date.now())
    glide(index)
  }

  const close = (refocus = false) => {
    if (refocus) triggerRefs.current[open]?.focus()
    setOpen(-1)
    if (!refocus) glide(-1)
  }

  // Click or tap anywhere else closes the menu.
  useEffect(() => {
    if (open < 0) return
    const away = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(-1)
        glide(-1)
      }
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])

  const step = (from: number, by: 1 | -1) => (from + by + menus.length) % menus.length

  const onTriggerKey = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const next = step(index, event.key === "ArrowRight" ? 1 : -1)
      setTabStop(next)
      triggerRefs.current[next]?.focus()
      glide(next)
      if (open >= 0) show(next)
    } else if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      show(index, true)
    } else if (event.key === "Escape") {
      close(true)
    } else return
    event.preventDefault()
  }

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <div
        role="menubar"
        aria-label={label}
        onPointerLeave={() => open < 0 && glide(-1)}
        className="relative inline-flex gap-0.5 rounded-xl border border-ui-border bg-ui-muted p-[3px]"
      >
        <span
          ref={glowRef}
          aria-hidden
          className={cn("pointer-events-none absolute inset-y-[3px] left-0 rounded-[9px] border border-ui-border bg-ui-bg opacity-0 transition-[transform,width,opacity]", MOTION)}
        />
        {menus.map((menu, index) => (
          <button
            key={menu.label}
            ref={(el) => {
              triggerRefs.current[index] = el
            }}
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === index}
            tabIndex={index === tabStop ? 0 : -1}
            onPointerEnter={() => {
              glide(index)
              if (open >= 0 && open !== index) show(index)
            }}
            onFocus={() => glide(index)}
            onClick={() => (open === index ? close() : show(index))}
            onKeyDown={(event) => onTriggerKey(event, index)}
            className="relative z-10 cursor-pointer rounded-[9px] px-3 py-1 text-sm font-medium text-ui-secondary outline-none transition-[color,scale] duration-150 ease-out select-none hover:text-ui-heading focus-visible:ring-2 focus-visible:ring-ui-border-strong active:scale-[0.96] aria-expanded:text-ui-heading motion-reduce:transition-none"
          >
            {menu.label}
          </button>
        ))}
      </div>

      {menus.map((menu, index) => (
        <div
          key={menu.label}
          ref={(el) => {
            panelRefs.current[index] = el
          }}
          className="absolute top-full left-0 mt-2"
        >
          <MenuPanel
            entries={menu.items}
            open={open === index}
            session={session}
            focusKey={open === index ? focusKey : 0}
            label={menu.label}
            onClose={(reason) => close(reason === "back")}
            onNavigate={(by) => show(step(index, by), true)}
            className="relative"
          />
        </div>
      ))}
    </div>
  )
}
