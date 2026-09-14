import { getPlayerStats, listFinishedGames } from '@/lib/game-service'
import { resolveSeasonFilter } from '@/lib/season-filter'
import { resolveScoring } from '@/lib/scoring-choice'
import { inclusiveEnd } from '@/lib/season'
import { WeeklyRecap } from '@/components/WeeklyRecap'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'
import { WEEK_PERIOD } from '@/components/stats/PeriodPicker'

export const dynamic = 'force-dynamic'

/** Monday 00:00 of the current week. */
function startOfWeek(now = new Date()): Date {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d)

export default async function RecapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const [season, scoring] = await Promise.all([
    resolveSeasonFilter(sp.saison),
    resolveScoring(sp.methode),
  ])

  // Sans saison choisie, le récap porte sur la semaine en cours ; avec une
  // saison, il couvre toute sa durée — même forme, autre fenêtre.
  const weekStart = startOfWeek()
  const window = season.window ?? { finishedSince: weekStart }

  const [stats, games] = await Promise.all([
    getPlayerStats(window),
    listFinishedGames(window),
  ])

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const period = season.range
    ? `Du ${fmtDay(season.range.startsAt)} au ${fmtDay(inclusiveEnd(season.range.endsAt))}`
    : `Du ${fmtDay(weekStart)} au ${fmtDay(weekEnd)}`

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats"
        title={season.name ? `Récap · ${season.name}` : 'Récap de la semaine'}
        description={
          season.name
            ? `Champion, podium et records de la saison ${season.name}.`
            : 'Ce qui s’est joué depuis lundi : joueur de la semaine, podium et records.'
        }
        meta={`${period} · ${games.length} partie${games.length !== 1 ? 's' : ''} terminée${games.length !== 1 ? 's' : ''}`}
        seasons={season.seasons}
        selectedSeason={season.selected === 'all' ? WEEK_PERIOD : season.selected}
        periodMode
        method={
          scoring.allowChoice
            ? { selected: scoring.config.method, admin: scoring.adminMethod }
            : undefined
        }
      />
      <WeeklyRecap
        stats={stats}
        gamesCount={games.length}
        scoringConfig={scoring.config}
        emptyLabel={season.name ? `Aucune partie terminée pour ${season.name}.` : undefined}
      />
    </div>
  )
}
