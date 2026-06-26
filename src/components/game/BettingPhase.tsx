'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (bets: { playerId: string; announced: number }[]) => Promise<void>
}

export function BettingPhase({ game, round, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(game.players.map((p) => [p.id, '0'])),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedPlayers = [...game.players].filter((p) => p.active).sort((a, b) => a.order - b.order)
  const n = sortedPlayers.length

  // The constrained player rotates: round 1 → last, round 2 → first, round 3 → second…
  const constrainedIndex = (round.number - 2 + n) % n
  const constrainedPlayer = sortedPlayers[constrainedIndex]!

  const getValue = (playerId: string) => parseInt(values[playerId] ?? '0', 10) || 0

  // Forbidden value for the constrained player = cardCount - sum of all others
  const sumOfOthers = sortedPlayers
    .filter((p) => p.id !== constrainedPlayer.id)
    .reduce((sum, p) => sum + getValue(p.id), 0)
  const forbiddenValue = round.cardCount - sumOfOthers

  const constrainedValue = getValue(constrainedPlayer.id)
  const constraintViolated = constrainedValue === forbiddenValue

  const currentSum = sortedPlayers.reduce((sum, p) => sum + getValue(p.id), 0)
  const canSubmit = !constraintViolated && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(
        sortedPlayers.map((p) => ({ playerId: p.id, announced: getValue(p.id) })),
      )
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
          Paris — {round.cardCount} carte{round.cardCount > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedPlayers.map((player) => {
          const isConstrained = player.id === constrainedPlayer.id
          const value = values[player.id] ?? '0'
          const isForbidden = isConstrained && constraintViolated

          return (
            <div key={player.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{player.name}</span>
              {isConstrained && (
                <span className={`text-xs ${isForbidden ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  interdit : {forbiddenValue >= 0 && forbiddenValue <= round.cardCount ? forbiddenValue : '—'}
                </span>
              )}
              <Input
                type="number"
                min={0}
                max={round.cardCount}
                value={value}
                onChange={(e) => setValues((prev) => ({ ...prev, [player.id]: e.target.value }))}
                className={`w-20 text-center ${isForbidden ? 'border-destructive ring-1 ring-destructive' : ''}`}
              />
            </div>
          )
        })}

        <div
          className={`flex justify-between text-xs pt-1 ${constraintViolated ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          <span>Somme des paris</span>
          <span>
            {currentSum} / {round.cardCount}
            {constraintViolated ? ' ⚠ interdit' : ''}
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {loading ? 'Envoi...' : 'Valider les paris'}
        </Button>
      </CardContent>
    </Card>
  )
}
