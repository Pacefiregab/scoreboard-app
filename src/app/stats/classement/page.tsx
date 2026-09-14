import { getPlayerStats } from '@/lib/game-service'
import { resolveSeasonFilter } from '@/lib/season-filter'
import { resolveScoring } from '@/lib/scoring-choice'
import { RankingTable } from '@/components/stats/RankingTable'
import { StatsEmpty } from '@/components/stats/StatsEmpty'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Classement général' }

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const [season, scoring] = await Promise.all([
    resolveSeasonFilter(sp.saison),
    resolveScoring(sp.methode),
  ])
  const stats = await getPlayerStats(season.window)

  const games = stats.reduce((sum, s) => sum + s.gamesPlayed, 0)

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/classement"
        description={
          season.name
            ? `Classement de la saison ${season.name}.`
            : 'Tous les joueurs, sur l’ensemble des parties terminées.'
        }
        meta={`${stats.length} joueur${stats.length !== 1 ? 's' : ''} · ${games} participation${games !== 1 ? 's' : ''}`}
        seasons={season.seasons}
        selectedSeason={season.selected}
        method={
          scoring.allowChoice
            ? { selected: scoring.config.method, admin: scoring.adminMethod }
            : undefined
        }
      />
      {stats.length === 0
        ? <StatsEmpty season={season.name} />
        : <RankingTable stats={stats} scoringConfig={scoring.config} />}
    </div>
  )
}
