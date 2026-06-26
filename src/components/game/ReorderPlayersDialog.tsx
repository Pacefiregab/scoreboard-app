'use client'

import { useState } from 'react'
import type { GameState, PlayerState } from '@/types/game'
import { getNextRoundNumber, getConstrainedIndex } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  game: GameState
  open: boolean
  onClose: () => void
  onDone: () => void
}

export function ReorderPlayersDialog({ game, open, onClose, onDone }: Props) {
  const [players, setPlayers] = useState<PlayerState[]>(
    [...game.players].sort((a, b) => a.order - b.order),
  )
  const [loading, setLoading] = useState(false)

  const nextRoundNumber = getNextRoundNumber(game)
  const constrainedIndex = getConstrainedIndex(nextRoundNumber, players.length)

  function moveUp(index: number) {
    if (index === 0) return
    setPlayers((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    if (index === players.length - 1) return
    setPlayers((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    try {
      await Promise.all(
        players.map((player, newOrder) =>
          fetch(`/api/games/${game.adminToken}/players/${player.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrder }),
          }),
        ),
      )
      onDone()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réorganiser les joueurs</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {players.map((player, index) => {
            const isConstrained = index === constrainedIndex
            return (
              <div
                key={player.id}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${isConstrained ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : ''}`}
              >
                <span className="text-sm text-muted-foreground w-5">{index + 1}.</span>
                <span className="flex-1 text-sm font-medium">{player.name}</span>
                {isConstrained && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    contraint M{nextRoundNumber}
                  </span>
                )}
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === players.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            )
          })}
        </div>
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Sauvegarde...' : 'Enregistrer'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
