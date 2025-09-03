'use client'

import { useRef } from 'react'
import { useChatLogic } from '@/hooks/useChat'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Badge } from '@/components/ui/Badge'

export function ChatSidebar() {
  const { messages, input, setInput, send, sending, insertToEditorFromAgent } = useChatLogic()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="h-[100dvh] min-h-0 flex flex-col">
      <header className="px-4 py-3 border-b">
        <h2 className="text-base font-semibold">Assistant</h2>
      </header>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {messages.map((m, idx) => (
            <Card key={idx} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={m.role === 'user' ? 'default' : 'secondary'}>{m.role}</Badge>
                {/* minimal UI: hide tool badge to reduce clutter */}
                {/* {m.meta?.tool && <Badge variant="outline">{m.meta.tool}</Badge>} */}
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.meta?.action === 'insert' && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      insertToEditorFromAgent((m.meta?.summary as string) || m.content)
                    }
                  >
                    Insert into editor
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      <form
        className="p-3 border-t flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
          inputRef.current?.focus()
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask anything. Try: "Find latest news on Next.js 15 and insert summary into editor."'
        />
        <Button disabled={sending} type="submit">
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  )
}
