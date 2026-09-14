import { getPlayerStats } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { DetailTable } from '@/components/stats/DetailTable'
import { StatsEmpty } from '@/components/stats/StatsEmpty'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Stats détaillées' }

export default async function DetailPage() {
  const [stats, finishedCount] = await Promise.all([
    getPlayerStats(),
    prisma.game.count({ where: { status: 'FINISHED' } }),
  ])

  if (finishedCount === 0) return <StatsEmpty />

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manches jouées, contrats remplis et records, par joueur.
      </p>
      <DetailTable stats={stats} />
    </div>
  )
}
