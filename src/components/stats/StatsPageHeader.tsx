import { findStatsView } from './views'
import { SeasonPicker, type SeasonOption } from './SeasonPicker'
import { PeriodPicker } from './PeriodPicker'
import { MethodPicker } from './MethodPicker'
import type { ScoringMethod } from '@/lib/scoring'

interface Props {
  /** Route of the view being rendered, used to look up its title and icon. */
  href: string
  /** Replaces the view's default title, when the season changes its meaning. */
  title?: string
  description?: string
  /** Counts or context specific to the page. */
  meta?: string
  seasons?: SeasonOption[]
  selectedSeason?: string
  /**
   * Sur le récap, le sélecteur porte sur la période et non sur un filtre :
   * ne rien choisir y signifie « cette semaine », pas « toutes les parties ».
   */
  periodMode?: boolean
  /** Renseigné seulement quand le choix de méthode est ouvert aux visiteurs. */
  method?: { selected: ScoringMethod; admin: ScoringMethod }
}

/**
 * Titre de la vue courante, répété dans le corps de la page : le menu étant
 * fermé la plupart du temps, l'en-tête seul ne suffit pas à situer l'onglet.
 */
export function StatsPageHeader({
  href,
  title,
  description,
  meta,
  seasons,
  selectedSeason,
  periodMode,
  method,
}: Props) {
  const view = findStatsView(href)
  if (!view) return null

  const Icon = view.icon

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Icon size={19} className="text-primary shrink-0" />
          {title ?? view.label}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {method && <MethodPicker selected={method.selected} adminMethod={method.admin} />}
          {periodMode
            ? <PeriodPicker seasons={seasons ?? []} selected={selectedSeason ?? 'semaine'} />
            : seasons && seasons.length > 0 && (
                <SeasonPicker seasons={seasons} selected={selectedSeason ?? 'all'} />
              )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{description ?? view.description}</p>
        {meta && <p className="text-xs text-muted-foreground/80">{meta}</p>}
      </div>
    </div>
  )
}
