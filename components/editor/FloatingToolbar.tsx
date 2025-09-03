'use client'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Instruction = 'shorten' | 'expand' | 'paraphrase' | 'table'

export function FloatingToolbar({
  onAction,
  disabled,
}: {
  onAction: (type: Instruction) => void
  disabled?: boolean
}) {
  const base =
    'inline-flex items-center gap-1 rounded-md border bg-background/90 p-0.5 shadow-sm backdrop-blur'
  const item =
    'px-2 py-1 text-xs rounded-sm hover:bg-muted cursor-pointer data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed'

  return (
    <div
      className={cn(base)}
      role="toolbar"
      aria-label="AI edit tools"
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        variant="ghost"
        size="sm"
        className={item}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onAction('shorten')}
        aria-label="Shorten selection"
        title="Shorten"
      >
        Shorten
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={item}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onAction('expand')}
        aria-label="Lengthen selection"
        title="Lengthen"
      >
        Lengthen
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={item}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onAction('paraphrase')}
        aria-label="Paraphrase selection"
        title="Paraphrase"
      >
        Paraphrase
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={item}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onAction('table')}
        aria-label="Convert selection to table"
        title="Convert to Table"
      >
        Convert to Table
      </Button>
    </div>
  )
}
