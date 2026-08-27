'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerNameInput } from '@/components/PlayerNameInput'
import { AppHeader } from '@/components/AppHeader'
import { maxCardCount } from '@/lib/enculette'
import { ChevronUp, ChevronDown, X, Plus, ChevronRight, Sparkles, MinusCircle, Check, Layers } from 'lucide-react'

const RULES = [
  {
    key: 'bonusX2' as const,
    icon: Sparkles,
    label: 'Bonus ×2',
    desc: 'Chaque joueur peut doubler son score sur une seule manche de la partie. L’admin arme le bonus au moment des paris.',
  },
  {
    key: 'penalties' as const,
    icon: MinusCircle,
    label: 'Pénalités',
    desc: 'L’admin peut retirer des points à un joueur (mauvaise distribution, erreur de carte…).',
  },
]

export default function NewGamePage() {
  const router = useRouter()
  const [players, setPlayers] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [rules, setRules] = useState({ bonusX2: false, penalties: false })
  const [penaltyPoints, setPenaltyPoints] = useState('10')
  const [deckCount, setDeckCount] = useState(1)

  const activeRules = RULES.filter((r) => rules[r.key])
  const penaltyValue = parseInt(penaltyPoints, 10)
  const penaltyInvalid = rules.penalties && (!Number.isInteger(penaltyValue) || penaltyValue < 1)

  function toggleRule(key: (typeof RULES)[number]['key']) {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function updatePlayer(index: number, value: string) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? value : p)))
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, ''])
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index))
  }

  function moveUp(index: number) {
    if (index === 0) return
    setPlayers((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    if (index === players.length - 1) return
    setPlayers((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const validPlayers = players.map((p) => p.trim()).filter(Boolean)
  const peak = maxCardCount({ deckCount, playerCount: validPlayers.length })
  const canSubmit = validPlayers.length >= 2 && !loading && !penaltyInvalid

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: validPlayers,
          rules: {
            ...rules,
            deckCount,
            ...(rules.penalties ? { penaltyPoints: penaltyValue } : {}),
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Erreur lors de la création')
        return
      }
      const game = await res.json() as { adminToken: string }
      router.push(`/game/${game.adminToken}`)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/" />
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nouvelle partie · L&apos;Enculette</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Joueurs (dans l&apos;ordre de jeu)</p>
            {players.map((name, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 h-4"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === players.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 h-4"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground w-5 text-right">{index + 1}.</span>
                <PlayerNameInput
                  placeholder={`Joueur ${index + 1}`}
                  value={name}
                  onChange={(v) => updatePlayer(index, v)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  autoFocus={index === players.length - 1 && index > 1}
                  exclude={players.filter((_, i) => i !== index).filter(Boolean)}
                />
                <button
                  onClick={() => removePlayer(index)}
                  disabled={players.length <= 2}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-20"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addPlayer} className="w-full gap-2">
            <Plus size={14} />
            Ajouter un joueur
          </Button>

          {/* Optional rules */}
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setRulesOpen((o) => !o)}
              aria-expanded={rulesOpen}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors rounded-lg"
            >
              <ChevronRight
                size={15}
                className={`text-muted-foreground transition-transform ${rulesOpen ? 'rotate-90' : ''}`}
              />
              <span className="flex-1 text-left">Règles supplémentaires</span>
              <span className="text-xs text-muted-foreground">
                {[
                  `${deckCount} paquet${deckCount > 1 ? 's' : ''}`,
                  ...activeRules.map((r) =>
                    r.key === 'penalties' && !penaltyInvalid
                      ? `${r.label} (−${penaltyValue})`
                      : r.label,
                  ),
                ].join(' · ')}
              </span>
            </button>

            {rulesOpen && (
              <div className="border-t p-2 space-y-1">
                {/* Decks — caps the peak of the pyramid */}
                <div className="flex items-center gap-2 rounded-lg px-2 py-2">
                  <Layers size={13} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-medium">Paquets de cartes</span>
                  <div className="flex gap-1">
                    {[1, 2].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDeckCount(n)}
                        aria-pressed={deckCount === n}
                        className={`h-8 w-9 rounded-lg border text-sm font-medium transition-colors ${
                          deckCount === n
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="px-2 pb-1 text-xs text-muted-foreground">
                  {validPlayers.length >= 2
                    ? `Avec ${validPlayers.length} joueurs, la montée pourra aller jusqu’à ${peak} carte${peak > 1 ? 's' : ''} par joueur.`
                    : 'Détermine jusqu’où la montée peut aller selon le nombre de joueurs.'}
                </p>

                {RULES.map(({ key, icon: Icon, label, desc }) => {
                  const checked = rules[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleRule(key)}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input'
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <Icon size={13} className="text-muted-foreground" />
                          {label}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>
                      </span>
                    </button>
                  )
                })}

                {rules.penalties && (
                  <div className="flex items-center gap-2 pl-9 pr-2 pb-1">
                    <label htmlFor="penalty-points" className="text-xs text-muted-foreground flex-1">
                      Points retirés par pénalité
                    </label>
                    <span className="text-sm text-muted-foreground">−</span>
                    <Input
                      id="penalty-points"
                      type="number"
                      min={1}
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(e.target.value)}
                      aria-invalid={penaltyInvalid}
                      className={`h-8 w-20 text-center ${penaltyInvalid ? 'border-destructive' : ''}`}
                    />
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
            {loading ? 'Création...' : 'Créer la partie'}
          </Button>
        </CardContent>
      </Card>
    </main>
    </div>
  )
}
