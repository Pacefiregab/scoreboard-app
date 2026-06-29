'use client'

import { useState, useEffect } from 'react'
import type { GameState, PlayerState } from '@/types/game'
import { getNextRoundNumber, getConstrainedIndex } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronUp, ChevronDown, EyeOff, Eye } from 'lucide-react'

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

  useEffect(() => {
    if (open) {
      setPlayers([...game.players].sort((a, b) => a.order - b.order))
    }
  }, [open, game.players])

  const nextRoundNumber = getNextRoundNumber(game)
  const activePlayers = players.filter((p) => p.active)
  const constrainedIndex = getConstrainedIndex(nextRoundNumber, activePlayers.length)
  const constrainedPlayerId = activePlayers[constrainedIndex]?.id

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

  function toggleActive(playerId: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, active: !p.active } : p)),
    )
  }

  async function handleSave() {
    setLoading(true)
    try {
      await Promise.all(
        players.map((player, newOrder) =>
          fetch(`/api/games/${game.adminToken}/players/${player.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrder, active: player.active }),
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
          <DialogTitle>Gérer les joueurs</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {players.map((player, index) => {
            const isConstrained = player.active && player.id === constrainedPlayerId
            return (
              <div
                key={player.id}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                  isConstrained
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                    : ''
                } ${!player.active ? 'opacity-40' : ''}`}
              >
                <span className="text-sm text-muted-foreground w-5">{index + 1}.</span>
                <span className={`flex-1 text-sm font-medium ${!player.active ? 'line-through' : ''}`}>
                  {player.name}
                </span>
                {isConstrained && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    contraint M{nextRoundNumber}
                  </span>
                )}
                <button
                  onClick={() => toggleActive(player.id)}
                  className={`p-1 rounded transition-colors ${
                    player.active
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground hover:text-green-600'
                  }`}
                  title={player.active ? 'Désactiver' : 'Réactiver'}
                >
                  {player.active ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
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
        <p className="text-xs text-muted-foreground px-1">
          Les joueurs désactivés ne participent pas aux manches suivantes mais conservent leur score.
        </p>
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Sauvegarde...' : 'Enregistrer'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
