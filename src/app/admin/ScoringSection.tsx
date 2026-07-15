'use client'

import { useState, useTransition } from 'react'
import { METHOD_META, DEFAULT_CONFIG, type ScoringConfig, type ScoringMethod } from '@/lib/scoring'
import { saveScoringConfigAction } from './actions'
import { Button } from '@/components/ui/button'

interface Props {
  current: ScoringConfig
}

export function ScoringSection({ current }: Props) {
  const [method, setMethod] = useState<ScoringMethod>(current.method)
  const [weights, setWeights] = useState(current.weights)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  const totalPct = Math.round((weights.wins + weights.score + weights.contract) * 100)
  const weightsValid = totalPct === 100

  function setWeight(key: keyof typeof weights, pct: number) {
    setWeights((prev) => ({ ...prev, [key]: pct / 100 }))
  }

  function resetWeights() {
    setWeights(DEFAULT_CONFIG.weights)
  }

  const isDirty =
    method !== current.method ||
    weights.wins !== current.weights.wins ||
    weights.score !== current.weights.score ||
    weights.contract !== current.weights.contract

  function handleSave() {
    if (method === 'A' && !weightsValid) return
    startTransition(async () => {
      await saveScoringConfigAction({ method, weights })
      setFeedback('Configuration sauvegardée — la page stats utilisera cette méthode.')
      setTimeout(() => setFeedback(null), 4000)
    })
  }

  return (
    <div className="space-y-6 max-w-lg">

      {/* Method selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Méthode de classement
        </p>
        {(['A', 'B', 'C'] as ScoringMethod[]).map((m) => (
          <label
            key={m}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              method === m ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <input
              type="radio"
              name="method"
              value={m}
              checked={method === m}
              onChange={() => setMethod(m)}
              className="mt-0.5 accent-primary"
            />
            <div>
              <p className="text-sm font-medium">
                <span className="font-mono text-muted-foreground mr-1.5">{m}.</span>
                {METHOD_META[m].label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{METHOD_META[m].desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Weights — method A only */}
      {method === 'A' && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pondérations</p>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono ${weightsValid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                Total : {totalPct} %
              </span>
              <button onClick={resetWeights} className="text-xs text-muted-foreground hover:text-foreground underline">
                Réinitialiser
              </button>
            </div>
          </div>

          {([
            ['wins', 'Taux de victoire', weights.wins],
            ['score', 'Score moyen', weights.score],
            ['contract', 'Taux de contrats', weights.contract],
          ] as [keyof typeof weights, string, number][]).map(([key, label, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-medium">{Math.round(val * 100)} %</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(val * 100)}
                onChange={(e) => setWeight(key, parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
          ))}

          {!weightsValid && (
            <p className="text-xs text-destructive">
              La somme doit être exactement 100 % (actuellement {totalPct} %)
            </p>
          )}
        </div>
      )}

      {feedback && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          ✓ {feedback}
        </p>
      )}

      <Button
        onClick={handleSave}
        disabled={isPending || !isDirty || (method === 'A' && !weightsValid)}
      >
        {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
      </Button>
    </div>
  )
}
