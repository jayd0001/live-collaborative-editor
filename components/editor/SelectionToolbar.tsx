'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SelectionToolbar({
  top,
  left,
  children,
}: {
  top: number
  left: number
  children: ReactNode
}) {
  return (
    <div
      className={cn('pointer-events-auto fixed z-50 -translate-x-1/2 -translate-y-full')}
      style={{ top, left }}
      role="dialog"
      aria-label="Selection tools"
    >
      {children}
    </div>
  )
}
