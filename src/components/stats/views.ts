import { Trophy, TrendingUp, CalendarDays, History, Medal, type LucideIcon } from 'lucide-react'

export interface StatsView {
  href: string
  label: string
  /** Shown under the title, to say what the view answers. */
  description: string
  icon: LucideIcon
}

/**
 * Source unique des vues de la section statistiques : le menu et l'en-tête de
 * chaque page s'y réfèrent, pour qu'un libellé ne puisse pas diverger entre les
 * deux. L'ordre est celui du menu ; la vue par défaut reste `/stats`, que cet
 * ordre ne détermine pas.
 */
export const STATS_VIEWS: StatsView[] = [
  {
    href: '/stats/palmares',
    label: 'Palmarès des saisons',
    description: 'Le champion de chaque saison, et le podium qui l’accompagne.',
    icon: Medal,
  },
  {
    href: '/stats',
    label: 'Récap de la semaine',
    description: 'Ce qui s’est joué depuis lundi : joueur de la semaine, podium et records.',
    icon: CalendarDays,
  },
  {
    href: '/stats/classement',
    label: 'Classement général',
    description: 'Tous les joueurs, sur l’ensemble des parties terminées.',
    icon: Trophy,
  },
  {
    href: '/stats/detail',
    label: 'Stats détaillées',
    description: 'Manches jouées, contrats remplis et records, joueur par joueur.',
    icon: TrendingUp,
  },
  {
    href: '/stats/historique',
    label: 'Historique des parties',
    description: 'Chaque partie terminée mène à son résumé complet.',
    icon: History,
  },
]

export function findStatsView(pathname: string): StatsView | undefined {
  return STATS_VIEWS.find((v) => v.href === pathname)
}
