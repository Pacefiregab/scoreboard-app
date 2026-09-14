import { listSeasons, type DateWindow } from './game-service'
import type { SeasonOption } from '@/components/stats/SeasonPicker'

export interface ResolvedSeasonFilter {
  /** `undefined` quand aucune saison n'est choisie : toutes les parties. */
  window: DateWindow | undefined
  seasons: SeasonOption[]
  /** Valeur du `select` : un identifiant, ou `all`. */
  selected: string
  /** Nom de la saison retenue, pour l'afficher dans l'en-tête. */
  name: string | null
  range: { startsAt: Date; endsAt: Date } | null
}

/**
 * Traduit le paramètre d'URL `saison` en fenêtre de dates. Un identifiant
 * inconnu retombe silencieusement sur « toutes les saisons » plutôt que
 * d'échouer : un lien partagé survit ainsi à la suppression d'une saison.
 */
export async function resolveSeasonFilter(param?: string): Promise<ResolvedSeasonFilter> {
  const seasons = await listSeasons()
  const options: SeasonOption[] = seasons.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    gameCount: s.gameCount,
  }))

  const match = param ? seasons.find((s) => s.id === param) : undefined

  if (!match) {
    return { window: undefined, seasons: options, selected: 'all', name: null, range: null }
  }

  return {
    window: { finishedSince: match.startsAt, finishedBefore: match.endsAt },
    seasons: options,
    selected: match.id,
    name: match.name,
    range: { startsAt: match.startsAt, endsAt: match.endsAt },
  }
}
