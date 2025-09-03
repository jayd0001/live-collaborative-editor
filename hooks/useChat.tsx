'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  meta?: {
    tool?: string
    action?: 'insert' | string
    summary?: string
  }
}

type SendOptions = {
  provider?: 'openai' | 'groq'
  apiKeys?: { openai?: string; groq?: string }
}

function dispatchInsertIntoEditor(html: string) {
  try {
    window.dispatchEvent(
      new CustomEvent('agent-insert-into-editor', {
        detail: { text: html, html: true },
      })
    )
  } catch (e) {
    console.error('failed to dispatch insert event:', e)
  }
}

const DEFAULT_GREETING: ChatMessage = {
  role: 'assistant',
  content:
    'Hi! I’m your AI assistant. Ask me to edit text, summarize links, or search the web. I can also insert content into the editor.',
}

function escapeHtml(s: string) {
  return s
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/"/g, '&quot;')
    .replaceAll(/'/g, '&#39;')
}

function normalizeAssistantHtml(s: string) {
  if (!s) return s
  // If it already contains HTML structure, keep as-is
  if (/<(p|ul|ol|li|h\d|table|section|article|div)\b/i.test(s)) return s

  const parts = s
    .split(/\r?\n\r?\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return s
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
}

export function useChatLogic(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0 ? initialMessages : [DEFAULT_GREETING]
  )
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy])

  const insertToEditorFromAgent = useCallback((htmlOrText: string) => {
    if (!htmlOrText) return
    dispatchInsertIntoEditor(htmlOrText)
  }, [])

  const send = useCallback(
    async (override?: { content?: string } & SendOptions) => {
      const content = (override?.content ?? input).trim()
      if (!content) return

      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }]
      setMessages(nextMessages)
      setInput('')
      setBusy(true)

      // Optional dev keys from localStorage (will be ignored if env keys exist)
      let groqKey: string | null = null
      let openaiKey: string | null = null
      try {
        groqKey = typeof window !== 'undefined' ? localStorage.getItem('dev_groq_key') : null
        openaiKey = typeof window !== 'undefined' ? localStorage.getItem('dev_openai_key') : null
      } catch {
        // ignore
      }

      const apiKeys =
        override?.apiKeys ||
        (groqKey || openaiKey
          ? {
              groq: groqKey || undefined,
              openai: openaiKey || undefined,
            }
          : undefined)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        console.log('chat -> /api/ai', { provider: override?.provider })
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            action: 'chat',
            provider: override?.provider,
            apiKeys,
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok) {
          let detail = ''
          try {
            const j = await res.json()
            detail = j?.error || j?.detail || res.statusText
          } catch {
            detail = await res.text()
          }
          throw new Error(detail || `Request failed with ${res.status}`)
        }

        const data = (await res.json()) as { text?: string; html?: string }
        const raw = (data.html || data.text || '').trim()
        console.log('chat response length:', raw.length)

        if (raw) {
          const html = normalizeAssistantHtml(raw)
          dispatchInsertIntoEditor(html)
        }
      } catch (e: any) {
        console.error('chat error:', e?.message || e)
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `Sorry, there was an error: ${String(e?.message || e)}`,
          },
        ])
      } finally {
        setBusy(false)
      }
    },
    [input, messages]
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([DEFAULT_GREETING])
    setInput('')
    setBusy(false)
  }, [])

  return {
    messages,
    input,
    setInput,
    send,
    canSend,
    busy,
    sending: busy,
    insertToEditorFromAgent,
    reset,
  }
}
