'use client'

import { useState } from 'react'

type Instruction = 'shorten' | 'expand' | 'paraphrase' | 'table'

export function useAiEdits({
  onPreview,
}: {
  onPreview: (original: string, suggestion: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null)
  const [pendingEditor, setPendingEditor] = useState<any>(null)
  const [pendingRange, setPendingRange] = useState<{ from: number; to: number } | null>(null)

  async function requestEdit({
    selection,
    instruction,
    editor,
  }: {
    selection: string
    instruction: Instruction
    editor: any
  }) {
    const trimmed = (selection || '').trim()
    if (!trimmed) {
      console.log('[AI edit skipped: empty selection')
      return
    }
    if (trimmed.length < 3) {
      console.log('[AI edit skipped: selection too short')
      return
    }

    console.log('AI edit starting:', instruction, 'on:', trimmed.substring(0, 50) + '...')
    setLoading(true)

    try {
      // Snapshot selection early and keep focus to avoid losing range
      const { from, to } = editor?.state?.selection ?? { from: 0, to: 0 }
      setPendingRange({ from, to })
      setPendingEditor(editor)

      // Open modal immediately with a placeholder
      setPendingSuggestion('Generating…')
      onPreview(trimmed, 'Generating…')

      // Optionally focus editor so confirm can apply at correct place later
      editor?.view?.focus()

      let groqKey: string | null = null
      let openaiKey: string | null = null
      try {
        groqKey = typeof window !== 'undefined' ? localStorage.getItem('dev_groq_key') : null
        openaiKey = typeof window !== 'undefined' ? localStorage.getItem('dev_openai_key') : null
      } catch {
        // ignore
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          selection: trimmed,
          instruction,
          apiKeys:
            groqKey || openaiKey
              ? {
                  groq: groqKey || undefined,
                  openai: openaiKey || undefined,
                }
              : undefined,
        }),
      })

      console.log('AI edit response status:', res.status)

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

      const data = (await res.json()) as { suggestion?: string; text?: string }
      const suggestion = (data.suggestion || data.text || '').trim()
      if (!suggestion) {
        throw new Error('Empty suggestion from AI')
      }

      console.log('AI edit success, suggestion length:', suggestion.length)
      setPendingSuggestion(suggestion)

      onPreview(trimmed, suggestion)
    } catch (e) {
      console.error('AI edit error:', (e as Error).message)
      onPreview(selection, `AI edit failed: ${(e as Error).message}`)
      alert(`AI edit failed: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  function confirmPreview(confirmed: boolean) {
    console.log('Preview confirm:', confirmed, 'has suggestion:', !!pendingSuggestion)

    if (confirmed && pendingSuggestion && pendingEditor) {
      const range = pendingRange ?? pendingEditor.state?.selection
      if (range?.from != null && range?.to != null) {
        pendingEditor
          .chain()
          .focus()
          .insertContentAt({ from: range.from, to: range.to }, pendingSuggestion)
          .run()
      } else {
        pendingEditor.chain().focus().insertContent(pendingSuggestion).run()
      }
    }
    setPendingSuggestion(null)
    setPendingEditor(null)
    setPendingRange(null)
  }

  return {
    loading,
    requestEdit,
    confirmPreview,
  }
}
