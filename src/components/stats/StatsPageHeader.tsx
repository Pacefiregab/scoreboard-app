import { findStatsView } from './views'

interface Props {
  /** Route of the view being rendered, used to look up its title and icon. */
  href: string
  /** Counts or context specific to the page, shown under the description. */
  meta?: string
}

/**
 * Titre de la vue courante, répété dans le corps de la page : le menu étant
 * fermé la plupart du temps, l'en-tête seul ne suffit pas à situer l'onglet.
 */
export function StatsPageHeader({ href, meta }: Props) {
  const view = findStatsView(href)
  if (!view) return null

  const Icon = view.icon

  return (
    <div className="space-y-1 border-b pb-4">
      <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <Icon size={19} className="text-primary shrink-0" />
        {view.label}
      </h1>
      <p className="text-sm text-muted-foreground">{view.description}</p>
      {meta && <p className="text-xs text-muted-foreground/80">{meta}</p>}
    </div>
  )
}
