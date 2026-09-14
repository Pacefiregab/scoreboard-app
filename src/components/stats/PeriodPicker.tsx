'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { SeasonOption } from './SeasonPicker'

/** Valeur du sélecteur quand le récap porte sur la semaine en cours. */
export const WEEK_PERIOD = 'semaine'

/**
 * Période couverte par le récap : la semaine en cours, ou une saison.
 *
 * Volontairement distinct de `SeasonPicker` : sur les autres vues, ne pas
 * choisir de saison signifie « toutes les parties », alors qu'ici cela
 * signifierait « cette semaine ». Un même libellé pour deux sens opposés est
 * précisément ce qui prêtait à confusion.
 */
export function PeriodPicker({
  seasons,
  selected,
}: {
  seasons: SeasonOption[]
  selected: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function choose(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === WEEK_PERIOD) next.delete('saison')
    else next.set('saison', value)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      Période
      <select
        value={selected}
        onChange={(e) => choose(e.target.value)}
        className="h-7 max-w-44 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
      >
        <option value={WEEK_PERIOD}>Cette semaine</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}{s.status === 'current' ? ' (en cours)' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
