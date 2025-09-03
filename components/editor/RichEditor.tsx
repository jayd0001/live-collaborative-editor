'use client'

import { useEffect, useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { FloatingToolbar } from './FloatingToolbar'
import { SelectionToolbar } from './SelectionToolbar'
import { Card } from '@/components/ui/Card'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { cn } from '@/lib/utils'
import { useEditorInsertBridge } from '@/hooks/useEditorInsertBridge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/ContextMenu'

type Instruction = 'shorten' | 'expand' | 'paraphrase' | 'table'

type Props = {
  onEditWithAI: (selection: string, instruction: Instruction, editor: any) => void
}

// helper to build a TipTap table node from CSV
function buildTableNodeFromCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const rows = lines.map((l) => l.split(',').map((c) => c.trim()))
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 0)

  // pad shorter rows to equal column count
  const padded = rows.map((r) => {
    const copy = [...r]
    while (copy.length < cols) copy.push('')
    return copy
  })

  const useHeader = padded.length > 1

  const makeCell = (type: 'tableHeader' | 'tableCell', text: string) => ({
    type,
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  })

  const content = padded.map((row, idx) => ({
    type: 'tableRow',
    content: row.map((cell) =>
      makeCell(useHeader && idx === 0 ? 'tableHeader' : 'tableCell', cell)
    ),
  }))

  return {
    type: 'table',
    content,
  }
}

export function RichEditor({ onEditWithAI }: Props) {
  const [hasSelection, setHasSelection] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({}),
      Placeholder.configure({
        placeholder: 'Start typing… Select text to see AI tools.',
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: 'table-auto border-collapse w-full' },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: `
      <h2>Welcome 👋</h2>
      <p>Type here, select text, and try the floating toolbar to apply AI edits (Shorten, Expand, Paraphrase, Convert to Table).</p>
      <p>You can also chat with the assistant on the right and ask it to insert summaries or ideas into the editor.</p>
      <ul>
        <li>* Select a sentence and press “Shorten”</li>
        <li>* Try “Convert to Table” on a comma-separated list</li>
        <li>* Use the chat: “Find latest news on Next.js 15 and insert summary into editor.”</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm md:prose-base lg:prose-lg max-w-none focus:outline-none',
      },
      handleDOMEvents: {
        mouseup: (view) => {
          updateSelectionState(view.state.selection.from, view.state.selection.to)
          return false
        },
        keyup: (view) => {
          updateSelectionState(view.state.selection.from, view.state.selection.to)
          return false
        },
      },
    },
  })

  useEditorInsertBridge(editor)

  function updateSelectionState(from: number, to: number) {
    const has = to > from
    setHasSelection(has)
    if (!has) {
      setPos(null)
      return
    }
    const sel = window.getSelection?.()
    if (!sel || sel.rangeCount === 0) {
      setPos(null)
      return
    }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect && rect.width >= 0 && rect.height >= 0) {
      setPos({
        top: rect.top + window.scrollY - 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      })
    } else {
      setPos(null)
    }
  }

  useEffect(() => {
    const onChange = () => {
      if (!editor) return
      const { from, to } = editor.state.selection
      updateSelectionState(from, to)
    }
    document.addEventListener('selectionchange', onChange)
    return () => document.removeEventListener('selectionchange', onChange)
  }, [editor])

  const selectionText = useMemo(() => {
    if (!editor) return ''
    const { from, to } = editor.state.selection
    if (to <= from) return ''
    return editor.state.doc.textBetween(from, to, ' ')
  }, [editor])

  return (
    <Card className="m-4 h-[calc(100dvh-96px)] overflow-hidden relative">
      <ScrollArea className="h-full">
        <div className={cn('p-4')}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div>
                <EditorContent editor={editor} />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="min-w-[12rem]">
              <ContextMenuItem
                className="cursor-pointer"
                disabled={false}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={(e) => {
                  e.preventDefault()
                  if (!editor) return
                  const { from, to } = editor.state.selection
                  const textNow = from < to ? editor.state.doc.textBetween(from, to, ' ') : ''
                  if (!textNow) return
                  editor.view.focus()
                  queueMicrotask(() => onEditWithAI(textNow, 'shorten', editor))
                }}
              >
                Shorten
              </ContextMenuItem>
              <ContextMenuItem
                className="cursor-pointer"
                disabled={false}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={(e) => {
                  e.preventDefault()
                  if (!editor) return
                  const { from, to } = editor.state.selection
                  const textNow = from < to ? editor.state.doc.textBetween(from, to, ' ') : ''
                  if (!textNow) return
                  editor.view.focus()
                  queueMicrotask(() => onEditWithAI(textNow, 'expand', editor))
                }}
              >
                Lengthen
              </ContextMenuItem>
              <ContextMenuItem
                className="cursor-pointer"
                disabled={false}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={(e) => {
                  e.preventDefault()
                  if (!editor) return
                  const { from, to } = editor.state.selection
                  const textNow = from < to ? editor.state.doc.textBetween(from, to, ' ') : ''
                  if (!textNow) return
                  editor.view.focus()
                  queueMicrotask(() => onEditWithAI(textNow, 'paraphrase', editor))
                }}
              >
                Paraphrase
              </ContextMenuItem>
              <ContextMenuItem
                className="cursor-pointer"
                disabled={false}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={(e) => {
                  e.preventDefault()
                  if (!editor) return
                  const { from, to } = editor.state.selection
                  const textNow = from < to ? editor.state.doc.textBetween(from, to, ' ') : ''
                  if (!textNow) return
                  const node = buildTableNodeFromCsv(textNow)
                  editor
                    .chain()
                    .focus()
                    .insertContentAt({ from, to }, node as any, { updateSelection: true })
                    .run()
                }}
              >
                Convert to Table
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </ScrollArea>

      {editor && hasSelection && pos && (
        <SelectionToolbar top={pos.top} left={pos.left}>
          <FloatingToolbar
            disabled={false}
            onAction={(instruction) => {
              if (!editor) return
              const { from, to } = editor.state.selection
              const textNow = from < to ? editor.state.doc.textBetween(from, to, ' ') : ''
              if (!textNow) {
                return
              }
              editor.view.focus()

              if (instruction === 'table') {
                const node = buildTableNodeFromCsv(textNow)
                editor
                  .chain()
                  .focus()
                  .insertContentAt({ from, to }, node as any, { updateSelection: true })
                  .run()
                return
              }

              queueMicrotask(() => onEditWithAI(textNow, instruction, editor))
            }}
          />
        </SelectionToolbar>
      )}
    </Card>
  )
}
