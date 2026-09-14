import { getPlayerStats, getScoringConfig } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { RankingTable } from '@/components/stats/RankingTable'
import { StatsEmpty } from '@/components/stats/StatsEmpty'

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  const [stats, finishedCount, scoringConfig] = await Promise.all([
    getPlayerStats(),
    prisma.game.count({ where: { status: 'FINISHED' } }),
    getScoringConfig(),
  ])

  if (finishedCount === 0) return <StatsEmpty />

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {finishedCount} partie{finishedCount !== 1 ? 's' : ''} terminée{finishedCount !== 1 ? 's' : ''}
        {' · '}
        {stats.length} joueur{stats.length !== 1 ? 's' : ''}
      </p>
      <RankingTable stats={stats} scoringConfig={scoringConfig} />
    </div>
  )
}
