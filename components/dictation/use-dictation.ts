"use client"

import { useEffect, useRef, useState } from "react"

type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort?: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

function getRecognition(): (new () => Recognition) | undefined {
  if (typeof window === "undefined") return undefined
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined
}

/**
 * Browser speech recognition. `onText` receives the full transcript so far on every result,
 * so the field can show words as they're heard. `supported` is false where the Web Speech API
 * is missing (or `enabled` is off), and is checked after mount so server and client agree.
 */
export function useDictation(enabled: boolean, onText: (transcript: string) => void) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<Recognition | null>(null)
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  useEffect(() => setSupported(enabled && Boolean(getRecognition())), [enabled])
  useEffect(() => () => recognitionRef.current?.stop(), [])

  const stop = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
  }

  const start = () => {
    const Recognition = getRecognition()
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language
    recognition.onresult = (event) =>
      onTextRef.current(Array.from(event.results, (result) => result[0]?.transcript ?? "").join(""))
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onerror = recognition.onend
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  /** Stops without delivering anything more: a late result can't bring discarded words back. */
  const cancel = () => {
    const recognition = recognitionRef.current
    if (recognition) {
      recognition.onresult = null
      if (recognition.abort) recognition.abort()
      else recognition.stop()
    }
    recognitionRef.current = null
    setListening(false)
  }

  return { supported, listening, start, stop, cancel, toggle: () => (listening ? stop() : start()) }
}
