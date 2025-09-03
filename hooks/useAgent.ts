'use client'

function dispatchInsertIntoEditor(text: string) {
  if (!text) return
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('agent-insert-into-editor', { detail: { text } }))
}

export function useAgent() {
  async function webSearch(query: string) {
    const res = await fetch('/api/agent/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = (await res.json()) as {
      summary?: string
      results?: Array<{ title: string; url: string }>
      error?: string
    }

    // Automatically insert the AI summary into the editor if available
    if (data?.summary && data.summary.trim()) {
      dispatchInsertIntoEditor(data.summary.trim())
    }

    return data
  }

  return { webSearch }
}
