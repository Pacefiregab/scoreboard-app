import { getPlayerStats, listFinishedGames, listSeasons } from '@/lib/game-service'
import { resolveSeasonFilter } from '@/lib/season-filter'
import { resolveScoring } from '@/lib/scoring-choice'
import { inclusiveEnd } from '@/lib/season'
import { rankByConfig, computeComposites } from '@/lib/scoring'
import { competitionRanks } from '@/lib/ranking'
import { WeeklyRecap } from '@/components/WeeklyRecap'
import { SeasonsOverview, type SeasonOverviewRow } from '@/components/stats/SeasonsOverview'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'
import { WEEK_PERIOD, ALL_SEASONS_PERIOD } from '@/components/stats/periods'

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
  const scoring = await resolveScoring(sp.methode)
  const config = scoring.config

  const methodPicker = scoring.allowChoice
    ? { selected: config.method, admin: scoring.adminMethod }
    : undefined

  // ── Vue transversale : une ligne par saison, avec son champion ──
  if (sp.saison === ALL_SEASONS_PERIOD) {
    const seasons = await listSeasons()

    const rows: SeasonOverviewRow[] = await Promise.all(
      seasons.map(async (season) => {
        const stats = await getPlayerStats({
          finishedSince: season.startsAt,
          finishedBefore: season.endsAt,
        })

        let champions: string[] = []
        let championValue = ''

        if (stats.length > 0) {
          const ranked = rankByConfig(stats, config)
          const composites = computeComposites(stats, config)
          const ranks = competitionRanks(ranked, (s) => {
            if (config.method === 'C') return `${s.wins}|${s.avgFinalScore}|${s.contractRate}`
            if (config.method === 'B') return `${s.f1Points}|${s.wins}`
            return String(composites.get(s.name) ?? 0)
          })
          const top = ranked.filter((_, i) => ranks[i] === 1)
          champions = top.map((s) => s.name)
          // La valeur affichée est celle qui a servi à classer, sinon un
          // deuxième à zéro victoire donne un podium incompréhensible.
          const first = top[0]!
          championValue =
            config.method === 'B' ? `${first.f1Points} pts F1`
            : config.method === 'A' ? `${composites.get(first.name) ?? 0} / 100`
            : `${first.wins} victoire${first.wins !== 1 ? 's' : ''}`
        }

        return {
          id: season.id,
          name: season.name,
          startsAt: season.startsAt.toISOString(),
          endsAt: inclusiveEnd(season.endsAt).toISOString(),
          status: season.status,
          gameCount: season.gameCount,
          playerCount: stats.length,
          champions,
          championValue,
        }
      }),
    )

    return (
      <div className="space-y-5">
        <StatsPageHeader
          href="/stats"
          title="Toutes les saisons"
          description="Le champion de chaque saison. Sélectionnez une saison pour son récap détaillé."
          meta={`${seasons.length} saison${seasons.length !== 1 ? 's' : ''} définie${seasons.length !== 1 ? 's' : ''}`}
          seasons={rows.map((r) => ({
            id: r.id, name: r.name, status: r.status, gameCount: r.gameCount,
          }))}
          selectedSeason={ALL_SEASONS_PERIOD}
          periodMode
          method={methodPicker}
        />
        <SeasonsOverview seasons={rows} />
      </div>
    )
  }

  // ── Récap d'une période : la semaine en cours, ou une saison ──
  const season = await resolveSeasonFilter(sp.saison)

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
        method={methodPicker}
      />
      <WeeklyRecap
        stats={stats}
        gamesCount={games.length}
        scoringConfig={config}
        periodLabel={season.name ? 'de la saison' : 'de la semaine'}
        emptyLabel={season.name ? `Aucune partie terminée pour ${season.name}.` : undefined}
      />
    </div>
  )
}
