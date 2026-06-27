'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberStepper } from './NumberStepper'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (results: { playerId: string; actual: number }[]) => Promise<void>
}

export function PlayingPhase({ game, round, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(game.players.map((p) => [p.id, 0])),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderedPlayers = [...game.players].filter((p) => p.active).sort((a, b) => a.order - b.order)

  const totalActual = orderedPlayers.reduce((sum, p) => sum + (values[p.id] ?? 0), 0)
  const sumValid = totalActual === round.cardCount
  const canSubmit = sumValid && !loading

  function set(playerId: string, value: number) {
    setValues((prev) => ({ ...prev, [playerId]: value }))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(orderedPlayers.map((p) => ({ playerId: p.id, actual: values[p.id] ?? 0 })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Résultats — {round.cardCount} carte{round.cardCount > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedPlayers.map((player) => {
          const bet = round.bets.find((b) => b.playerId === player.id)

          return (
            <div key={player.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-base font-medium">{player.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  pariait {bet?.announced ?? '?'}
                </p>
              </div>
              <NumberStepper
                value={values[player.id] ?? 0}
                onChange={(v) => set(player.id, v)}
                min={0}
                max={round.cardCount}
              />
            </div>
          )
        })}

        <div
          className={`flex justify-between text-sm pt-1 ${!sumValid ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          <span>Total plis saisis</span>
          <span>
            {totalActual} / {round.cardCount}
            {!sumValid ? ' ⚠ doit être égal' : ' ✓'}
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-11 text-base">
          {loading ? 'Envoi...' : 'Valider les résultats'}
        </Button>
      </CardContent>
    </Card>
  )
}
