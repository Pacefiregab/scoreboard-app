'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createSeasonAction, updateSeasonAction, deleteSeasonAction, generateSeasonsAction,
} from './actions'
import { Wand2, Trash2, Pencil, Check, X } from 'lucide-react'

export interface SeasonRow {
  id: string
  name: string
  /** ISO `AAAA-MM-JJ`, déjà converti en dernier jour inclus pour l'affichage. */
  startsAt: string
  endsAt: string
  status: 'upcoming' | 'current' | 'past'
  gameCount: number
}

const STATUS = {
  current: { label: 'en cours', className: 'border-primary/40 bg-primary/10 text-foreground' },
  upcoming: { label: 'à venir', className: 'border-border text-muted-foreground' },
  past: { label: 'terminée', className: 'border-border text-muted-foreground' },
} as const

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(`${iso}T12:00:00Z`))

export function SeasonManagement({ seasons }: { seasons: SeasonRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', startsAt: '', endsAt: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name: '', startsAt: '', endsAt: '' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function run(fn: () => Promise<string>) {
    setError(null)
    startTransition(async () => {
      try {
        const message = await fn()
        setFeedback(message)
        setTimeout(() => setFeedback(null), 5000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          ✓ {feedback}
        </p>
      )}
      {error && <p className="text-sm text-destructive px-1">{error}</p>}

      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm font-medium">Générer les saisons calendaires</p>
        <p className="text-xs text-muted-foreground">
          Crée les saisons de trois mois (printemps, été, automne, hiver) depuis la première
          partie jouée jusqu’à aujourd’hui. Les périodes déjà couvertes sont ignorées, donc
          l’action peut être relancée sans risque de doublon.
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(generateSeasonsAction)}
          className="gap-2"
        >
          <Wand2 size={14} />
          Générer
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Saison</th>
              <th className="text-left px-4 py-3 font-medium">Période</th>
              <th className="text-right px-4 py-3 font-medium">Parties</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {seasons.map((season) => {
              const status = STATUS[season.status]
              const isEditing = editing === season.id

              if (isEditing) {
                return (
                  <tr key={season.id} className="bg-muted/30">
                    <td className="px-4 py-2" colSpan={4}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={edit.name}
                          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                          className="h-8 w-44"
                          placeholder="Nom"
                        />
                        <Input
                          type="date"
                          value={edit.startsAt}
                          onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })}
                          className="h-8 w-40"
                        />
                        <span className="text-xs text-muted-foreground">au</span>
                        <Input
                          type="date"
                          value={edit.endsAt}
                          onChange={(e) => setEdit({ ...edit, endsAt: e.target.value })}
                          className="h-8 w-40"
                        />
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            run(async () => {
                              const msg = await updateSeasonAction(season.id, edit)
                              setEditing(null)
                              return msg
                            })
                          }
                        >
                          <Check size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                          <X size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={season.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium">{season.name}</span>
                    <span className={`ml-2 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {fmt(season.startsAt)} → {fmt(season.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{season.gameCount}</td>
                  <td className="px-4 py-3">
                    {confirmDelete === season.id ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() =>
                            run(async () => {
                              const msg = await deleteSeasonAction(season.id)
                              setConfirmDelete(null)
                              return msg
                            })
                          }
                        >
                          Oui
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                          Non
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => {
                            setEditing(season.id)
                            setEdit({ name: season.name, startsAt: season.startsAt, endsAt: season.endsAt })
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Modifier ${season.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(season.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Supprimer ${season.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {seasons.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">Aucune saison</p>
        )}
      </div>

      {creating ? (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-medium">Nouvelle saison</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Nom (ex. Saison des amis)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-9 w-56"
            />
            <Input
              type="date"
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
              className="h-9 w-40"
            />
            <span className="text-xs text-muted-foreground">au</span>
            <Input
              type="date"
              value={draft.endsAt}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
              className="h-9 w-40"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Les deux bornes sont incluses. Une saison ne peut pas chevaucher une autre.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending || !draft.name.trim() || !draft.startsAt || !draft.endsAt}
              onClick={() =>
                run(async () => {
                  const msg = await createSeasonAction(draft)
                  setDraft({ name: '', startsAt: '', endsAt: '' })
                  setCreating(false)
                  return msg
                })
              }
            >
              Créer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          Ajouter une saison
        </Button>
      )}
    </div>
  )
}
