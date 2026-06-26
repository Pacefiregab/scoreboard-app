'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (results: { playerId: string; actual: number }[]) => Promise<void>
}

export function PlayingPhase({ game, round, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(game.players.map((p) => [p.id, '0'])),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderedPlayers = [...game.players].sort((a, b) => a.order - b.order)

  const parsed = orderedPlayers.map((p) => ({
    playerId: p.id,
    actual: parseInt(values[p.id] ?? '0', 10) || 0,
  }))

  const totalActual = parsed.reduce((sum, v) => sum + v.actual, 0)
  const sumValid = totalActual === round.cardCount
  const canSubmit = sumValid && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Résultats — {round.cardCount} carte{round.cardCount > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orderedPlayers.map((player) => {
          const bet = round.bets.find((b) => b.playerId === player.id)
          const value = values[player.id] ?? '0'

          return (
            <div key={player.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{player.name}</span>
              <span className="text-xs text-muted-foreground w-16 text-right">
                pariait {bet?.announced ?? '?'}
              </span>
              <Input
                type="number"
                min={0}
                max={round.cardCount}
                value={value}
                onChange={(e) => setValues((prev) => ({ ...prev, [player.id]: e.target.value }))}
                className="w-20 text-center"
              />
            </div>
          )
        })}

        <div
          className={`flex justify-between text-xs pt-1 ${!sumValid ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          <span>Total plis saisis</span>
          <span>
            {totalActual} / {round.cardCount}
            {!sumValid ? ' ⚠ doit être égal' : ' ✓'}
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {loading ? 'Envoi...' : 'Valider les résultats'}
        </Button>
      </CardContent>
    </Card>
  )
}
