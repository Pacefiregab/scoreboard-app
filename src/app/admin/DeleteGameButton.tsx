'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteGameAction } from './actions'

interface Props {
  id: string
}

export function DeleteGameButton({ id }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteGameAction(id)
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending ? '...' : 'Confirmer'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirm(false)} disabled={isPending}>
          Annuler
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirm(true)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 size={14} />
    </Button>
  )
}
