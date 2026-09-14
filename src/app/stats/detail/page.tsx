import { getPlayerStats } from '@/lib/game-service'
import { resolveSeasonFilter } from '@/lib/season-filter'
import { DetailTable } from '@/components/stats/DetailTable'
import { StatsEmpty } from '@/components/stats/StatsEmpty'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Stats détaillées' }

export default async function DetailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const season = await resolveSeasonFilter(sp.saison)
  const stats = await getPlayerStats(season.window)

  // Somme des contrats de chaque joueur, pas des manches : un joueur par manche.
  const contracts = stats.reduce((sum, s) => sum + s.roundsPlayed, 0)
  const met = stats.reduce((sum, s) => sum + s.betsWon, 0)
  const rate = contracts > 0 ? Math.round((met / contracts) * 100) : 0

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/detail"
        description={
          season.name
            ? `Détail des joueurs sur la saison ${season.name}.`
            : 'Manches jouées, contrats remplis et records, joueur par joueur.'
        }
        meta={`${stats.length} joueur${stats.length !== 1 ? 's' : ''} · ${met} contrats remplis sur ${contracts} (${rate} %)`}
        seasons={season.seasons}
        selectedSeason={season.selected}
      />
      {stats.length === 0 ? <StatsEmpty season={season.name} /> : <DetailTable stats={stats} />}
    </div>
  )
}
