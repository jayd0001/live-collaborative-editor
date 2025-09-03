'use client'

import { useState } from 'react'
import { RichEditor } from '@/components/editor/RichEditor'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { PreviewModal } from '@/components/editor/PreviewModal'
import { useAiEdits } from '@/hooks/useAiEdits'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function Page() {
  const [originalText, setOriginalText] = useState<string>('')
  const [suggestedText, setSuggestedText] = useState<string>('')
  const [openPreview, setOpenPreview] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  const { requestEdit, confirmPreview } = useAiEdits({
    onPreview: (original, suggestion) => {
      setOriginalText(original)
      setSuggestedText(suggestion)
      setOpenPreview(true)
    },
  })

  return (
    <main className="flex min-h-[100dvh]">
      <section className="flex-1 flex flex-col border-r">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-lg font-semibold text-pretty">Live Collaborative AI Editor</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorKey((k) => k + 1)}
              aria-label="Reset editor"
            >
              Reset
            </Button>
          </div>
        </header>

        <div className={cn('flex-1 overflow-auto')}>
          <RichEditor
            key={editorKey}
            onEditWithAI={(selection, instruction, editor) => {
              requestEdit({ selection, instruction, editor })
            }}
          />
        </div>
      </section>

      <aside className="w-full max-w-md shrink-0">
        <ChatSidebar />
      </aside>

      <PreviewModal
        open={openPreview}
        onOpenChange={(v) => {
          if (!v) {
            // Cancel: no replacement
            setOpenPreview(false)
            confirmPreview(false)
          } else {
            setOpenPreview(true)
          }
        }}
        original={originalText}
        suggestion={suggestedText}
        onConfirm={() => {
          // Confirm: replace selection with suggestion via hook bridge
          confirmPreview(true)
          setOpenPreview(false)
        }}
      />
    </main>
  )
}
