'use client'

import { useState, useEffect, useRef } from 'react'
import type { GameState, RoundState } from '@/types/game'
import { computeRoundScores } from '@/lib/enculette'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NumberStepper } from './NumberStepper'
import { Tooltip } from '@/components/ui/tooltip'

interface Props {
  game: GameState
  /** Manche à corriger, déjà terminée. */
  round: RoundState | null
  onClose: () => void
  onDone: () => void
}

interface Row {
  playerId: string
  name: string
  announced: number
  actual: number
  bonusX2: boolean
}

export function AmendRoundDialog({ game, round, onClose, onDone }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resync à l'ouverture seulement : `game` est un nouvel objet à chaque
  // sondage (4 s), et en dépendre écraserait la saisie en cours.
  const openedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!round) {
      openedFor.current = null
      return
    }
    if (openedFor.current === round.id) return
    openedFor.current = round.id

    setRows(
      round.bets.map((b) => ({
        playerId: b.playerId,
        name: game.players.find((p) => p.id === b.playerId)?.name ?? '?',
        announced: b.announced,
        actual: b.actual ?? 0,
        bonusX2: b.bonusX2,
      })),
    )
    setError(null)
  }, [round, game.players])

  if (!round) return null

  function set(playerId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.playerId === playerId ? { ...r, ...patch } : r)))
  }

  const totalActual = rows.reduce((sum, r) => sum + r.actual, 0)
  const totalAnnounced = rows.reduce((sum, r) => sum + r.announced, 0)
  const actualValid = totalActual === round.cardCount
  const announcedValid = totalAnnounced !== round.cardCount
  const canSave = actualValid && announcedValid && !loading

  // Aperçu des points, calculé avec la même fonction que le serveur.
  const preview = computeRoundScores(
    rows.map((r) => ({
      playerId: r.playerId,
      announced: r.announced,
      actual: r.actual,
      bonusX2: r.bonusX2,
    })),
  )

  async function handleSave() {
    if (!canSave || !round) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/games/${game.adminToken}/rounds/${round.id}/results`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entries: rows.map(({ playerId, announced, actual, bonusX2 }) => ({
              playerId, announced, actual, bonusX2,
            })),
          }),
        },
      )
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Erreur lors de la correction')
        return
      }
      onDone()
      onClose()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Corriger la manche {round.number} · {round.cardCount} carte
            {round.cardCount > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Les totaux de toutes les manches suivantes seront recalculés.
        </p>

        <div className="space-y-3 pt-1">
          {rows.map((row) => {
            const points = preview.find((p) => p.playerId === row.playerId)?.points ?? 0
            return (
              <div key={row.playerId} className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-medium text-sm truncate">{row.name}</span>
                  {game.rules.bonusX2 && (
                    <Tooltip label="Bonus ×2 sur cette manche — points doublés, gain comme perte">
                      <button
                        onClick={() => set(row.playerId, { bonusX2: !row.bonusX2 })}
                        aria-pressed={row.bonusX2}
                        className={`h-7 w-8 rounded-md border text-[11px] font-bold transition-colors ${
                          row.bonusX2
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input text-muted-foreground hover:border-primary'
                        }`}
                      >
                        ×2
                      </button>
                    </Tooltip>
                  )}
                  <span
                    className={`w-12 text-right font-mono text-sm font-semibold ${
                      points >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                    }`}
                  >
                    {points >= 0 ? '+' : ''}{points}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-12 text-xs text-muted-foreground">Pari</span>
                  <NumberStepper
                    value={row.announced}
                    onChange={(v) => set(row.playerId, { announced: v })}
                    min={0}
                    max={round.cardCount}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-xs text-muted-foreground">Plis</span>
                  <NumberStepper
                    value={row.actual}
                    onChange={(v) => set(row.playerId, { actual: v })}
                    min={0}
                    max={round.cardCount}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-1 text-sm">
          <div className={`flex justify-between ${actualValid ? 'text-muted-foreground' : 'text-destructive'}`}>
            <span>Somme des plis</span>
            <span>
              {totalActual} / {round.cardCount}
              {actualValid ? ' ✓' : ' ⚠ doit être égal'}
            </span>
          </div>
          <div className={`flex justify-between ${announcedValid ? 'text-muted-foreground' : 'text-destructive'}`}>
            <span>Somme des paris</span>
            <span>
              {totalAnnounced}
              {announcedValid ? '' : ` ⚠ interdit (${round.cardCount})`}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!canSave} className="flex-1">
            {loading ? 'Correction…' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
