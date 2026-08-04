'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { resolveConstrainedPlayerId } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberStepper } from './NumberStepper'
import { Tooltip } from '@/components/ui/tooltip'
import { Lock, Sparkles } from 'lucide-react'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (bets: { playerId: string; announced: number; bonusX2: boolean }[]) => Promise<void>
}

export function BettingPhase({ game, round, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(game.players.map((p) => [p.id, 0])),
  )
  const [bonuses, setBonuses] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedPlayers = [...game.players].filter((p) => p.active).sort((a, b) => a.order - b.order)

  // One ×2 per player for the whole game. Bets of earlier rounds are the record
  // of what has been spent — resetting a round's bets frees the bonus again.
  const spentBonus = new Set(
    game.rounds.flatMap((r) => r.bets).filter((b) => b.bonusX2).map((b) => b.playerId),
  )

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

  function toggleBonus(playerId: string) {
    setBonuses((prev) => ({ ...prev, [playerId]: !prev[playerId] }))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(
        sortedPlayers.map((p) => ({
          playerId: p.id,
          announced: values[p.id] ?? 0,
          bonusX2: bonuses[p.id] === true,
        })),
      )
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
          const bonusSpent = spentBonus.has(player.id)
          const bonusArmed = bonuses[player.id] === true

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
                {bonusArmed && (
                  <p className="text-xs mt-0.5 text-muted-foreground">×2 armé</p>
                )}
              </div>

              {game.rules.bonusX2 && (
                <Tooltip
                  label={
                    bonusSpent
                      ? `${player.name} a déjà utilisé son bonus ×2`
                      : bonusArmed
                        ? 'Retirer le bonus ×2'
                        : `Armer le bonus ×2 de ${player.name} — une seule fois par partie, la perte est doublée aussi`
                  }
                >
                  <button
                    onClick={() => !bonusSpent && toggleBonus(player.id)}
                    disabled={bonusSpent}
                    aria-pressed={bonusArmed}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${
                      bonusSpent
                        ? 'border-dashed border-border text-muted-foreground/40'
                        : bonusArmed
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                  >
                    {bonusSpent ? <Sparkles size={13} /> : '×2'}
                  </button>
                </Tooltip>
              )}

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
          {game.rules.bonusX2 && ' · ×2 : un bonus par joueur pour toute la partie.'}
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
