'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { resolveConstrainedPlayerId } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberStepper } from './NumberStepper'
import { Lock } from 'lucide-react'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (bets: { playerId: string; announced: number }[]) => Promise<void>
}

export function BettingPhase({ game, round, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(game.players.map((p) => [p.id, 0])),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedPlayers = [...game.players].filter((p) => p.active).sort((a, b) => a.order - b.order)

  const constrainedPlayerId = resolveConstrainedPlayerId(
    sortedPlayers,
    round.number,
    round.constrainedPlayerId,
  )!
  const constrainedPlayer = sortedPlayers.find((p) => p.id === constrainedPlayerId)!

  const sumOfOthers = sortedPlayers
    .filter((p) => p.id !== constrainedPlayerId)
    .reduce((sum, p) => sum + (values[p.id] ?? 0), 0)
  const forbiddenValue = round.cardCount - sumOfOthers

  const constrainedValue = values[constrainedPlayerId] ?? 0
  const constraintViolated = constrainedValue === forbiddenValue

  const currentSum = sortedPlayers.reduce((sum, p) => sum + (values[p.id] ?? 0), 0)
  const canSubmit = !constraintViolated && !loading

  function set(playerId: string, value: number) {
    setValues((prev) => ({ ...prev, [playerId]: value }))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(sortedPlayers.map((p) => ({ playerId: p.id, announced: values[p.id] ?? 0 })))
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
          Paris — {round.cardCount} carte{round.cardCount > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedPlayers.map((player) => {
          const isConstrained = player.id === constrainedPlayerId
          const isForbidden = isConstrained && constraintViolated

          return (
            <div key={player.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-medium">{player.name}</span>
                  {isConstrained && (
                    <Lock size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                {isConstrained && (
                  <p className={`text-xs mt-0.5 ${isForbidden ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    interdit : {forbiddenValue >= 0 && forbiddenValue <= round.cardCount ? forbiddenValue : '—'}
                  </p>
                )}
              </div>
              <NumberStepper
                value={values[player.id] ?? 0}
                onChange={(v) => set(player.id, v)}
                min={0}
                max={round.cardCount}
                error={isForbidden}
              />
            </div>
          )
        })}

        <p className="text-xs text-muted-foreground">
          🔒 {constrainedPlayer.name} est contraint — modifiable depuis « Gérer les joueurs ».
        </p>

        <div
          className={`flex justify-between text-sm pt-1 ${constraintViolated ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          <span>Somme des paris</span>
          <span>
            {currentSum} / {round.cardCount}
            {constraintViolated ? ' ⚠ interdit' : ''}
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-11 text-base">
          {loading ? 'Envoi...' : 'Valider les paris'}
        </Button>
      </CardContent>
    </Card>
  )
}
