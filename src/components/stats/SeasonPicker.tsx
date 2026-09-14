'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export interface SeasonOption {
  id: string
  name: string
  status: 'upcoming' | 'current' | 'past'
  gameCount: number
}

const STATUS_LABEL = { current: 'en cours', upcoming: 'à venir', past: '' } as const

/**
 * Change de saison en conservant la vue courante : la saison vit dans l'URL,
 * donc un lien partagé garde le filtre, et le bouton retour fonctionne.
 */
export function SeasonPicker({ seasons, selected }: { seasons: SeasonOption[]; selected: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  if (seasons.length === 0) return null

  function choose(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === 'all') next.delete('saison')
    else next.set('saison', value)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      Saison
      <select
        value={selected}
        onChange={(e) => choose(e.target.value)}
        className="h-7 max-w-44 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
      >
        <option value="all">Toutes les saisons</option>
        {seasons.map((s) => {
          const suffix = STATUS_LABEL[s.status]
          return (
            <option key={s.id} value={s.id}>
              {s.name}{suffix ? ` (${suffix})` : ''} — {s.gameCount}
            </option>
          )
        })}
      </select>
    </label>
  )
}
