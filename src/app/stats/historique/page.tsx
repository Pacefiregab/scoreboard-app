import { listFinishedGames } from '@/lib/game-service'
import { resolveSeasonFilter } from '@/lib/season-filter'
import { HistoryList } from '@/components/stats/HistoryList'
import { StatsEmpty } from '@/components/stats/StatsEmpty'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Historique des parties' }

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const season = await resolveSeasonFilter(sp.saison)
  const games = await listFinishedGames(season.window)

  // Dates must be serialised to cross into the client component.
  const serialised = games.map((g) => ({ ...g, finishedAt: g.finishedAt.toISOString() }))
  const rounds = games.reduce((sum, g) => sum + g.roundCount, 0)

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/historique"
        description={
          season.name
            ? `Parties jouées pendant la saison ${season.name}.`
            : 'Chaque partie terminée mène à son résumé complet.'
        }
        meta={`${games.length} partie${games.length !== 1 ? 's' : ''} · ${rounds} manche${rounds !== 1 ? 's' : ''} au total`}
        seasons={season.seasons}
        selectedSeason={season.selected}
      />
      {games.length === 0 ? <StatsEmpty season={season.name} /> : <HistoryList games={serialised} />}
    </div>
  )
}
