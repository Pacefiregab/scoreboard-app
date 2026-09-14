import { listFinishedGames } from '@/lib/game-service'
import { HistoryList } from '@/components/stats/HistoryList'
import { StatsEmpty } from '@/components/stats/StatsEmpty'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Historique des parties' }

export default async function HistoryPage() {
  const games = await listFinishedGames()

  // Dates must be serialised to cross into the client component.
  const serialised = games.map((g) => ({ ...g, finishedAt: g.finishedAt.toISOString() }))
  const rounds = games.reduce((sum, g) => sum + g.roundCount, 0)

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/historique"
        meta={`${games.length} partie${games.length !== 1 ? 's' : ''} · ${rounds} manche${rounds !== 1 ? 's' : ''} au total`}
      />
      {games.length === 0 ? <StatsEmpty /> : <HistoryList games={serialised} />}
    </div>
  )
}
