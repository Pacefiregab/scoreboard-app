'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerNameInput } from '@/components/PlayerNameInput'
import { AppHeader } from '@/components/AppHeader'
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react'

export default function NewGamePage() {
  const router = useRouter()
  const [players, setPlayers] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const canSubmit = validPlayers.length >= 2 && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: validPlayers }),
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
