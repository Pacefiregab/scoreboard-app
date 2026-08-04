'use client'

import { useState } from 'react'
import type { GameState } from '@/types/game'
import { getNextRoundNumber, resolveConstrainedPlayerId } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlayerNameInput } from '@/components/PlayerNameInput'

interface Props {
  game: GameState
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

export function AddPlayerDialog({ game, open, onOpenChange, onAdded }: Props) {
  const [name, setName] = useState('')
  const [score, setScore] = useState('0')
  const [position, setPosition] = useState(String(game.players.length))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedPlayers = [...game.players].sort((a, b) => a.order - b.order)
  const nextRoundNumber = getNextRoundNumber(game)
  const insertAt = Math.min(Math.max(parseInt(position, 10) || 0, 0), sortedPlayers.length)

  // Simulate the player list after insertion. The preview must mirror the server:
  // `order` is an index over *all* players, but the constraint only ever applies
  // to the *active* ones — and an admin override on the current round wins.
  const NEW_ID = '__new__'
  const simulatedList = [
    ...sortedPlayers.slice(0, insertAt),
    { id: NEW_ID, name: name.trim() || 'Nouveau joueur', active: true },
    ...sortedPlayers.slice(insertAt),
  ]
  const currentRound = game.rounds.at(-1)
  const override = currentRound?.status === 'BETTING' ? currentRound.constrainedPlayerId : null
  const constrainedId = resolveConstrainedPlayerId(
    simulatedList.filter((p) => p.active),
    nextRoundNumber,
    override,
  )

  async function handleAdd() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/games/${game.adminToken}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          initialScore: parseInt(score, 10) || 0,
          order: insertAt,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Erreur')
        return
      }
      setName('')
      setScore('0')
      setPosition(String(game.players.length))
      onAdded()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un joueur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Nom</Label>
            <PlayerNameInput
              placeholder="Prénom du joueur"
              value={name}
              onChange={setName}
              exclude={game.players.map((p) => p.name)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Score de départ</Label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Position (0 = 1er)</Label>
              <Input
                type="number"
                min={0}
                max={game.players.length}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          {/* Constrained player preview */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              Ordre après ajout · M{nextRoundNumber}
            </p>
            <div className="space-y-0.5">
              {simulatedList.map((player, index) => {
                const isConstrained = player.id === constrainedId
                const isNew = player.id === NEW_ID
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-2 text-xs rounded px-1.5 py-0.5 ${isConstrained ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : ''} ${!player.active ? 'opacity-40' : ''}`}
                  >
                    <span className="text-muted-foreground w-4">{index + 1}.</span>
                    <span className={`flex-1 ${isNew ? 'font-semibold' : ''} ${!player.active ? 'line-through' : ''}`}>
                      {player.name}
                      {isNew && ' ✦'}
                    </span>
                    {isConstrained && (
                      <span className="font-medium">contraint</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground pt-0.5">
              {override
                ? 'Contrainte forcée manuellement pour cette manche.'
                : 'Modifiable après ajout depuis l’écran des paris.'}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleAdd} disabled={!name.trim() || loading} className="w-full">
            {loading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
