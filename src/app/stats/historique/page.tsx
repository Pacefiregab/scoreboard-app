import { listFinishedGames } from '@/lib/game-service'
import { HistoryList } from '@/components/stats/HistoryList'
import { StatsEmpty } from '@/components/stats/StatsEmpty'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Historique des parties' }

export default async function HistoryPage() {
  const games = await listFinishedGames()

  if (games.length === 0) return <StatsEmpty />

  // Dates must be serialised to cross into the client component.
  const serialised = games.map((g) => ({ ...g, finishedAt: g.finishedAt.toISOString() }))

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Chaque partie mène à son résumé : classement final, détail des manches et graphe.
      </p>
      <HistoryList games={serialised} />
    </div>
  )
}
