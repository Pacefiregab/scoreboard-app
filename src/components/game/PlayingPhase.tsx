'use client'

import { useState } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberStepper } from './NumberStepper'
import { ChevronLeft } from 'lucide-react'

interface Props {
  game: GameState
  round: RoundState
  onSubmit: (results: { playerId: string; actual: number }[]) => Promise<void>
  onBack: () => Promise<void>
}

export function PlayingPhase({ game, round, onSubmit, onBack }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(game.players.map((p) => [p.id, 0])),
  )
  const [loading, setLoading] = useState(false)
  const [backLoading, setBackLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const betPlayerIds = new Set(round.bets.map((b) => b.playerId))
  const orderedPlayers = [...game.players]
    .filter((p) => p.active || betPlayerIds.has(p.id))
    .sort((a, b) => a.order - b.order)

  const totalActual = orderedPlayers.reduce((sum, p) => sum + (values[p.id] ?? 0), 0)
  const sumValid = totalActual === round.cardCount
  const canSubmit = sumValid && !loading && !backLoading

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

  async function handleBack() {
    setBackLoading(true)
    setError(null)
    try {
      await onBack()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setBackLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            disabled={backLoading || loading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors p-0.5 -ml-0.5"
            title="Revenir aux paris"
          >
            <ChevronLeft size={18} />
          </button>
          <CardTitle className="text-lg">
            Résultats — {round.cardCount} carte{round.cardCount > 1 ? 's' : ''}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedPlayers.map((player) => {
          const bet = round.bets.find((b) => b.playerId === player.id)
          const actual = values[player.id] ?? 0
          const contractMet = bet !== undefined && actual === bet.announced

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                contractMet ? 'bg-green-50 dark:bg-green-950/30' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className={`text-base font-medium ${contractMet ? 'text-green-700 dark:text-green-400' : ''}`}>
                  {player.name}
                </span>
                <p className={`text-xs mt-0.5 ${contractMet ? 'text-green-600 dark:text-green-500 font-medium' : 'text-muted-foreground'}`}>
                  {contractMet ? `✓ contrat (${bet!.announced})` : `pariait ${bet?.announced ?? '?'}`}
                </p>
              </div>
              <NumberStepper
                value={actual}
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
