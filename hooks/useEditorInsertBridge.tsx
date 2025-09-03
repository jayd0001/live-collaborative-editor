'use client'

import { useEffect } from 'react'

function isOnboardingDocText(text: string) {
  const t = text.replace(/\s+/g, ' ').trim().toLowerCase()
  return (
    t.startsWith('welcome') &&
    t.includes('select text') &&
    (t.includes('floating toolbar') || t.includes('convert to table'))
  )
}

export function useEditorInsertBridge(editor: any) {
  useEffect(() => {
    if (!editor) return
    const handler = (e: any) => {
      const text = (e.detail?.text as string) || ''
      const asHtml = Boolean(e.detail?.html)
      if (!text) return

      const docText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')

      if (isOnboardingDocText(docText)) {
        if (asHtml) {
          editor.commands.setContent(text, false)
        } else {
          editor.commands.setContent(`<p>${text}</p>`, false)
        }
        editor.commands.focus('end')
        return
      }

      const { from, to } = editor.state.selection
      if (to > from) {
        editor
          .chain()
          .focus()
          .insertContentAt({ from, to }, text, { parseOptions: { preserveWhitespace: 'full' } })
          .run()
      } else {
        editor.chain().focus().insertContent(text).run()
      }
    }
    window.addEventListener('agent-insert-into-editor', handler)
    return () => window.removeEventListener('agent-insert-into-editor', handler)
  }, [editor])
}
