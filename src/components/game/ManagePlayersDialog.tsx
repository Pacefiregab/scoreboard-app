'use client'

import { useState, useEffect, useRef } from 'react'
import type { GameState, PlayerState } from '@/types/game'
import { getNextRoundNumber, getUpcomingConstrainedPlayerId } from '@/lib/constrained-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlayerNameInput } from '@/components/PlayerNameInput'
import { ChevronUp, ChevronDown, EyeOff, Eye, Lock, Plus, X, RotateCcw } from 'lucide-react'

/** A player still being added: no server id until save. */
const NEW_ID = '__new__'

type Row = Pick<PlayerState, 'id' | 'name' | 'active'> & { initialScore: number }

interface Props {
  game: GameState
  open: boolean
  onClose: () => void
  onDone: () => void
}

export function ManagePlayersDialog({ game, open, onClose, onDone }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [constraint, setConstraint] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newScore, setNewScore] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastRound = game.rounds.at(-1)
  const inBetting = lastRound?.status === 'BETTING'
  const inPlaying = lastRound?.status === 'PLAYING'
  const nextRoundNumber = getNextRoundNumber(game)

  // Resync only on open: `game.players` is a fresh array on every poll (4s), so
  // depending on it here would wipe edits in progress.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setRows(
        [...game.players]
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ id: p.id, name: p.name, active: p.active, initialScore: p.initialScore })),
      )
      setConstraint(lastRound?.constrainedPlayerId ?? null)
      setAdding(false)
      setNewName('')
      setNewScore('0')
      setError(null)
    }
    wasOpen.current = open
  }, [open, game.players, lastRound?.constrainedPlayerId])

  const activeRows = rows.filter((r) => r.active)
  // Preview against the pending list so the table shows what saving will produce.
  const constrainedId = constraint && activeRows.some((r) => r.id === constraint)
    ? constraint
    : getUpcomingConstrainedPlayerId(
        { ...game, rounds: game.rounds.map((r) => (r.id === lastRound?.id ? { ...r, constrainedPlayerId: null } : r)) },
        activeRows,
      )
  const isShifted = Boolean(constraint && activeRows.some((r) => r.id === constraint))

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= rows.length) return
    setRows((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target]!, next[index]!]
      return next
    })
  }

  function toggleActive(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))
    setConstraint((c) => (c === id ? null : c))
  }

  function confirmAdd() {
    if (!newName.trim()) return
    setRows((prev) => [
      ...prev,
      { id: NEW_ID, name: newName.trim(), active: true, initialScore: parseInt(newScore, 10) || 0 },
    ])
    setAdding(false)
    setNewName('')
    setNewScore('0')
  }

  function removePending() {
    setRows((prev) => prev.filter((r) => r.id !== NEW_ID))
    setConstraint((c) => (c === NEW_ID ? null : c))
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      let finalRows = rows

      // Create the pending player first so the reorder can address it by id.
      const pending = rows.find((r) => r.id === NEW_ID)
      if (pending) {
        const res = await fetch(`/api/games/${game.adminToken}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: pending.name,
            initialScore: pending.initialScore,
            order: rows.indexOf(pending),
          }),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          setError(data.error ?? 'Erreur lors de l’ajout du joueur')
          return
        }
        const { id } = await res.json() as { id: string }
        finalRows = rows.map((r) => (r.id === NEW_ID ? { ...r, id } : r))
        setRows(finalRows)
        if (constraint === NEW_ID) setConstraint(id)
      }

      const reorder = await fetch(`/api/games/${game.adminToken}/players`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: finalRows.map((r, order) => ({ id: r.id, order, active: r.active })),
        }),
      })
      if (!reorder.ok) {
        const data = await reorder.json() as { error?: string }
        setError(data.error ?? 'Erreur lors de la réorganisation')
        return
      }

      // The constraint lives on the round, and only while bets are open.
      if (inBetting && lastRound) {
        const target = constraint === NEW_ID
          ? finalRows.find((r) => r.name === pending?.name)?.id ?? null
          : constraint
        if (target !== (lastRound.constrainedPlayerId ?? null)) {
          const res = await fetch(`/api/games/${game.adminToken}/rounds/${lastRound.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ constrainedPlayerId: target }),
          })
          if (!res.ok) {
            const data = await res.json() as { error?: string }
            setError(data.error ?? 'Erreur lors du changement de contrainte')
            return
          }
        }
      }

      onDone()
      onClose()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const hasPending = rows.some((r) => r.id === NEW_ID)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer les joueurs</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 pt-2">
          {rows.map((row, index) => {
            const isConstrained = row.active && row.id === constrainedId
            const isNew = row.id === NEW_ID
            return (
              <div
                key={row.id}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${
                  isConstrained
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                    : 'border border-transparent'
                } ${!row.active ? 'opacity-40' : ''}`}
              >
                <span className="text-sm text-muted-foreground w-5 shrink-0">{index + 1}.</span>

                <span className={`flex-1 text-sm font-medium truncate ${!row.active ? 'line-through' : ''}`}>
                  {row.name}
                  {isNew && <span className="text-primary"> ✦</span>}
                </span>

                {isConstrained && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                    M{nextRoundNumber}
                  </span>
                )}

                {/* Constrain */}
                <button
                  onClick={() => setConstraint(isConstrained ? null : row.id)}
                  disabled={!row.active}
                  title={
                    !row.active
                      ? 'Un joueur désactivé ne peut pas être contraint'
                      : isConstrained
                        ? 'Revenir à la rotation automatique'
                        : `Contraindre ${row.name}`
                  }
                  className={`p-1 rounded transition-colors disabled:opacity-20 ${
                    isConstrained
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground/40 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
                >
                  <Lock size={14} />
                </button>

                {/* Activate / deactivate, or drop the pending row */}
                {isNew ? (
                  <button
                    onClick={removePending}
                    title="Retirer"
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => toggleActive(row.id)}
                    title={row.active ? 'Désactiver' : 'Réactiver'}
                    className={`p-1 rounded transition-colors ${
                      row.active
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-muted-foreground hover:text-green-600'
                    }`}
                  >
                    {row.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}

                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add a player */}
        {!inPlaying && !hasPending && (
          adding ? (
            <div className="rounded-lg border p-3 space-y-2">
              <PlayerNameInput
                placeholder="Prénom du joueur"
                value={newName}
                onChange={setNewName}
                onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
                exclude={rows.map((r) => r.name)}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Score de départ</span>
                <Input
                  type="number"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="h-8 w-24"
                />
                <div className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={confirmAdd} disabled={!newName.trim()}>
                  Ajouter
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full gap-2">
              <Plus size={14} />
              Ajouter un joueur
            </Button>
          )
        )}

        {isShifted && (
          <button
            onClick={() => setConstraint(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <RotateCcw size={12} />
            Revenir à la rotation par défaut
          </button>
        )}

        <div className="space-y-1.5 px-1">
          <p className="text-xs text-muted-foreground">
            Les joueurs désactivés ne participent pas aux manches suivantes mais conservent leur score.
          </p>
          {!inBetting && (
            <p className="text-xs text-muted-foreground">
              Le joueur contraint (🔒) ne peut être changé que pendant la saisie des paris — ici il est
              affiché à titre indicatif pour M{nextRoundNumber}.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive px-1">{error}</p>}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
