'use client'

import { useState, useTransition } from 'react'
import type { PlayerEntry } from '@/lib/game-service'
import { Button } from '@/components/ui/button'
import { mergePlayersAction, deletePlayersAction } from './actions'
import { Trash2, Merge } from 'lucide-react'

interface Props {
  players: PlayerEntry[]
}

export function PlayerManagement({ players }: Props) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Merge form
  const [fromName, setFromName] = useState('')
  const [toName, setToName] = useState('')
  const [mergeConfirm, setMergeConfirm] = useState(false)

  function flash(msg: string) {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 4000)
  }

  function handleDelete(name: string) {
    startTransition(async () => {
      const count = await deletePlayersAction(name)
      setDeleteConfirm(null)
      flash(`${count} enregistrement${count !== 1 ? 's' : ''} supprimé${count !== 1 ? 's' : ''} pour « ${name} »`)
    })
  }

  function handleMerge() {
    if (!fromName || !toName || fromName === toName) return
    startTransition(async () => {
      const count = await mergePlayersAction(fromName, toName)
      setFromName('')
      setToName('')
      setMergeConfirm(false)
      flash(`${count} occurrence${count !== 1 ? 's' : ''} de « ${fromName} » renommée${count !== 1 ? 's' : ''} en « ${toName} »`)
    })
  }

  const canMerge = fromName && toName && fromName !== toName && !isPending

  return (
    <div className="space-y-4">

      {/* Feedback */}
      {feedback && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          ✓ {feedback}
        </p>
      )}

      {/* Merge form */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Merge size={15} className="text-muted-foreground" />
          Fusionner deux joueurs
        </div>
        <p className="text-xs text-muted-foreground">
          Toutes les parties du joueur source seront rattachées au joueur cible. Les statistiques seront regroupées.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={fromName}
            onChange={(e) => { setFromName(e.target.value); setMergeConfirm(false) }}
            className="flex-1 min-w-32 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Source…</option>
            {players.map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.count})</option>
            ))}
          </select>
          <span className="text-muted-foreground text-sm shrink-0">→</span>
          <select
            value={toName}
            onChange={(e) => { setToName(e.target.value); setMergeConfirm(false) }}
            className="flex-1 min-w-32 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Cible…</option>
            {players.filter((p) => p.name !== fromName).map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.count})</option>
            ))}
          </select>

          {!mergeConfirm ? (
            <Button
              size="sm"
              variant="outline"
              disabled={!canMerge}
              onClick={() => setMergeConfirm(true)}
            >
              Fusionner
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 dark:text-amber-400">Confirmer ?</span>
              <Button size="sm" variant="destructive" onClick={handleMerge} disabled={isPending}>
                {isPending ? '…' : 'Oui'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMergeConfirm(false)} disabled={isPending}>
                Non
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Player table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Joueur</th>
              <th className="text-right px-4 py-3 font-medium">Parties</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {players.map((player) => (
              <tr key={player.name} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{player.name}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{player.count}</td>
                <td className="px-4 py-3">
                  {deleteConfirm === player.name ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-destructive whitespace-nowrap">Supprimer ?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(player.name)}
                        disabled={isPending}
                      >
                        {isPending ? '…' : 'Oui'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm(null)}
                        disabled={isPending}
                      >
                        Non
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(player.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">Aucun joueur</p>
        )}
      </div>
    </div>
  )
}
