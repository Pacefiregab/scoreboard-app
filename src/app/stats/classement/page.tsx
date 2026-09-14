import { getPlayerStats, getScoringConfig } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { RankingTable } from '@/components/stats/RankingTable'
import { StatsEmpty } from '@/components/stats/StatsEmpty'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Classement général' }

export default async function RankingPage() {
  const [stats, finishedCount, scoringConfig] = await Promise.all([
    getPlayerStats(),
    prisma.game.count({ where: { status: 'FINISHED' } }),
    getScoringConfig(),
  ])

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/classement"
        meta={`${stats.length} joueur${stats.length !== 1 ? 's' : ''} · ${finishedCount} partie${finishedCount !== 1 ? 's' : ''} terminée${finishedCount !== 1 ? 's' : ''}`}
      />
      {finishedCount === 0
        ? <StatsEmpty />
        : <RankingTable stats={stats} scoringConfig={scoringConfig} />}
    </div>
  )
}
