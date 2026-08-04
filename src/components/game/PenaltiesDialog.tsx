'use client'

import { useState } from 'react'
import type { GameState } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { Undo2 } from 'lucide-react'

interface Props {
  game: GameState
  open: boolean
  onClose: () => void
  onDone: () => void
}

export function PenaltiesDialog({ game, open, onClose, onDone }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unit = game.rules.penaltyPoints
  const players = [...game.players].sort((a, b) => a.order - b.order)

  function penaltiesOf(playerId: string) {
    return game.penalties.filter((p) => p.playerId === playerId)
  }

  async function apply(playerId: string) {
    setBusy(playerId)
    setError(null)
    try {
      const res = await fetch(`/api/games/${game.adminToken}/penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, count: 1, reason: reason.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Erreur lors de l’ajout de la pénalité')
        return
      }
      setReason('')
      onDone()
    } catch {
      setError('Erreur réseau')
    } finally {
      setBusy(null)
    }
  }

  async function undo(penaltyId: string, playerId: string) {
    setBusy(playerId)
    setError(null)
    try {
      const res = await fetch(`/api/games/${game.adminToken}/penalties/${penaltyId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Erreur lors de l’annulation')
        return
      }
      onDone()
    } catch {
      setError('Erreur réseau')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pénalités</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Chaque pénalité retire {unit} point{unit > 1 ? 's' : ''}. Le motif est optionnel et
          s’applique à la prochaine pénalité donnée.
        </p>

        <Input
          placeholder="Motif (mauvaise distribution, erreur de carte…)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-9"
        />

        <div className="space-y-1">
          {players.map((player) => {
            const list = penaltiesOf(player.id)
            const last = list.at(-1)
            const total = list.reduce((sum, p) => sum + p.points, 0)

            return (
              <div key={player.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <span className={`flex-1 text-sm font-medium truncate ${!player.active ? 'opacity-40 line-through' : ''}`}>
                  {player.name}
                </span>

                {total > 0 && (
                  <Tooltip
                    label={
                      list
                        .map((p) => `−${p.points}${p.reason ? ` · ${p.reason}` : ''}`)
                        .join('\n')
                    }
                  >
                    <span className="text-xs font-mono text-destructive shrink-0">
                      −{total}
                      <span className="text-muted-foreground"> ({list.length})</span>
                    </span>
                  </Tooltip>
                )}

                {last && (
                  <Tooltip label="Annuler la dernière pénalité">
                    <button
                      onClick={() => undo(last.id, player.id)}
                      disabled={busy !== null}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <Undo2 size={14} />
                    </button>
                  </Tooltip>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => apply(player.id)}
                  disabled={busy !== null}
                  className="h-8 shrink-0 font-mono"
                >
                  {busy === player.id ? '…' : `−${unit}`}
                </Button>
              </div>
            )
          })}
        </div>

        {error && <p className="text-sm text-destructive px-1">{error}</p>}

        <Button variant="outline" onClick={onClose} className="w-full">
          Fermer
        </Button>
      </DialogContent>
    </Dialog>
  )
}
