'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { resolveConstrainedPlayerId } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberStepper } from './NumberStepper'
import { Lock, RotateCcw } from 'lucide-react'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (bets: { playerId: string; announced: number }[]) => Promise<void>
  onConstraintChange?: () => void
}

export function BettingPhase({ game, round, onSubmit, onConstraintChange }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(game.players.map((p) => [p.id, 0])),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Applied instantly so the UI doesn't wait for the next poll to reflect the pick.
  const [pendingConstraint, setPendingConstraint] = useState<string | null | undefined>(undefined)

  const sortedPlayers = [...game.players].filter((p) => p.active).sort((a, b) => a.order - b.order)

  const overrideId = pendingConstraint !== undefined ? pendingConstraint : round.constrainedPlayerId
  const constrainedPlayerId = resolveConstrainedPlayerId(sortedPlayers, round.number, overrideId)!
  const constrainedPlayer = sortedPlayers.find((p) => p.id === constrainedPlayerId)!
  const isManual = Boolean(overrideId && sortedPlayers.some((p) => p.id === overrideId))

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

  async function setConstrainedPlayer(playerId: string | null) {
    const previous = pendingConstraint
    setPendingConstraint(playerId)
    setError(null)
    try {
      const res = await fetch(`/api/games/${game.adminToken}/rounds/${round.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constrainedPlayerId: playerId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setPendingConstraint(previous)
        setError(data.error ?? 'Erreur lors du changement de contrainte')
        return
      }
      onConstraintChange?.()
    } catch {
      setPendingConstraint(previous)
      setError('Erreur réseau')
    }
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
                  <button
                    onClick={() => setConstrainedPlayer(isConstrained ? null : player.id)}
                    title={
                      isConstrained
                        ? 'Revenir à la rotation automatique'
                        : `Contraindre ${player.name} à la place`
                    }
                    aria-pressed={isConstrained}
                    className={`p-0.5 rounded transition-colors ${
                      isConstrained
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground/40 hover:text-amber-600 dark:hover:text-amber-400'
                    }`}
                  >
                    <Lock size={13} />
                  </button>
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

        {isManual && (
          <button
            onClick={() => setConstrainedPlayer(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={12} />
            Contrainte décalée sur {constrainedPlayer.name} — revenir à la rotation par défaut
          </button>
        )}

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
