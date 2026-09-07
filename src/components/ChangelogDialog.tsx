'use client'

import { CHANGELOG } from '@/data/changelog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  /** Entries newer than this get a « nouveau » marker. Null marks none. */
  highlightSince?: string | null
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

export function ChangelogDialog({ open, onClose, highlightSince }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-muted-foreground" />
            Nouveautés
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {CHANGELOG.map((entry) => {
            const isNew = highlightSince != null && entry.date > highlightSince
            return (
              <div key={entry.date}>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold">{formatDate(entry.date)}</h3>
                  {isNew && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 text-[10px] font-medium text-foreground">
                      nouveau
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {entry.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <span aria-hidden className="text-muted-foreground/50">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Fermer
        </Button>
      </DialogContent>
    </Dialog>
  )
}
