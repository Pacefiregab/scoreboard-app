'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { METHOD_META, type ScoringMethod } from '@/lib/scoring'

const METHODS: ScoringMethod[] = ['A', 'B', 'C']

/**
 * Laisse le visiteur classer selon la méthode de son choix. Le choix vit dans
 * l'URL, comme la saison : un lien partagé conserve donc la vue exacte.
 */
export function MethodPicker({
  selected,
  adminMethod,
}: {
  selected: ScoringMethod
  adminMethod: ScoringMethod
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function choose(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === adminMethod) next.delete('methode')
    else next.set('methode', value)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      Classer par
      <select
        value={selected}
        onChange={(e) => choose(e.target.value)}
        className="h-7 max-w-48 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
      >
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {METHOD_META[m].label}
            {m === adminMethod ? ' (par défaut)' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
