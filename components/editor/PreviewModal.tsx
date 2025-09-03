'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Card } from '@/components/ui/Card'

export function PreviewModal({
  open,
  onOpenChange,
  original,
  suggestion,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  original: string
  suggestion: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview AI Edit</DialogTitle>
          <DialogDescription>Compare and confirm changes.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-3">
            <h4 className="text-sm font-medium mb-2">Original</h4>
            <ScrollArea className="h-48">
              <p className="text-sm whitespace-pre-wrap">{original}</p>
            </ScrollArea>
          </Card>
          <Card className="p-3">
            <h4 className="text-sm font-medium mb-2">AI Suggestion</h4>
            <ScrollArea className="h-48">
              <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
            </ScrollArea>
          </Card>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
