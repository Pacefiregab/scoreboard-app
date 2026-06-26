'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameState } from '@/types/game'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AddPlayerDialog } from './AddPlayerDialog'
import { ReorderPlayersDialog } from './ReorderPlayersDialog'
import {
  Menu,
  UserPlus,
  ArrowDownUp,
  ChevronsDown,
  Flag,
  GripVertical,
  Hash,
  X,
} from 'lucide-react'

interface Props {
  game: GameState
  onAction: () => void
}

export function GameMenu({ game, onAction }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  const [reorderOpen, setReorderOpen] = useState(false)
  const [cardCountValue, setCardCountValue] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const lastRound = game.rounds.at(-1)
  const inBetting = lastRound?.status === 'BETTING'
  const inPlaying = lastRound?.status === 'PLAYING'
  const hasScores = game.rounds.some((r) => r.status === 'DONE')
  const canSwitchPhase =
    game.phase === 'ASCENDING' && (!lastRound || lastRound.status === 'DONE')

  async function post(path: string, label: string, body?: object) {
    setLoading(label)
    try {
      await fetch(`/api/games/${game.adminToken}/${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      onAction()
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  async function handleChangeCardCount() {
    const n = parseInt(cardCountValue, 10)
    if (!lastRound || isNaN(n) || n < 1) return
    setLoading('cardCount')
    try {
      await fetch(`/api/games/${game.adminToken}/rounds/${lastRound.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardCount: n }),
      })
      onAction()
      setCardCountValue('')
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel() {
    setLoading('cancel')
    try {
      await fetch(`/api/games/${game.adminToken}/cancel`, { method: 'POST' })
      router.push('/')
    } finally {
      setLoading(null)
    }
  }

  async function handleFinish() {
    await post('finish', 'finish')
    router.push(`/game/${game.adminToken}/summary`)
  }

  function closeAndOpen(action: () => void) {
    setOpen(false)
    setTimeout(action, 150)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
          <Menu size={18} />
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">Options</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-1 pb-6">
            {/* Change card count — only during betting */}
            {inBetting && (
              <div className="flex items-center gap-2 px-1 py-2">
                <Hash size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm flex-1">Nombre de cartes</span>
                <Input
                  type="number"
                  min={1}
                  placeholder={String(lastRound?.cardCount ?? '')}
                  value={cardCountValue}
                  onChange={(e) => setCardCountValue(e.target.value)}
                  className="w-20 text-center h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleChangeCardCount}
                  disabled={!cardCountValue || loading === 'cardCount'}
                  className="h-8"
                >
                  OK
                </Button>
              </div>
            )}

            {/* Add player */}
            {!inPlaying && (
              <button
                onClick={() => closeAndOpen(() => setAddPlayerOpen(true))}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
              >
                <UserPlus size={16} className="text-muted-foreground" />
                Ajouter un joueur
              </button>
            )}

            {/* Reorder players */}
            <button
              onClick={() => closeAndOpen(() => setReorderOpen(true))}
              className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
            >
              <GripVertical size={16} className="text-muted-foreground" />
              Réorganiser les joueurs
            </button>

            {/* Switch to descending */}
            {canSwitchPhase && (
              <button
                onClick={() => post('descend', 'descend')}
                disabled={loading === 'descend'}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronsDown size={16} className="text-muted-foreground" />
                Commencer la descente
              </button>
            )}

            <Separator className="my-1" />

            {/* Finish — only when there are scores */}
            {hasScores && !inPlaying && (
              <button
                onClick={handleFinish}
                disabled={loading === 'finish'}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors text-orange-600 dark:text-orange-400"
              >
                <Flag size={16} />
                Terminer la partie
              </button>
            )}

            {/* Cancel */}
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors text-destructive"
              >
                <X size={16} />
                {hasScores ? 'Annuler la partie' : 'Annuler la partie'}
              </button>
            ) : (
              <div className="rounded-lg border border-destructive/50 p-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {hasScores
                    ? '⚠️ Supprimer définitivement cette partie et tout son historique ?'
                    : 'Annuler et supprimer cette partie ?'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={loading === 'cancel'}
                    className="flex-1"
                  >
                    {loading === 'cancel' ? 'Suppression...' : 'Confirmer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelConfirm(false)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddPlayerDialog
        game={game}
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        onAdded={() => { onAction(); setAddPlayerOpen(false) }}
      />

      <ReorderPlayersDialog
        game={game}
        open={reorderOpen}
        onClose={() => setReorderOpen(false)}
        onDone={onAction}
      />
    </>
  )
}
