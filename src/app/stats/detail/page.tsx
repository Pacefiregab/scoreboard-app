import { getPlayerStats } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { DetailTable } from '@/components/stats/DetailTable'
import { StatsEmpty } from '@/components/stats/StatsEmpty'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Stats détaillées' }

export default async function DetailPage() {
  const [stats, finishedCount] = await Promise.all([
    getPlayerStats(),
    prisma.game.count({ where: { status: 'FINISHED' } }),
  ])

  // Somme des contrats de chaque joueur, pas des manches : un joueur par manche.
  const contracts = stats.reduce((sum, s) => sum + s.roundsPlayed, 0)
  const met = stats.reduce((sum, s) => sum + s.betsWon, 0)
  const rate = contracts > 0 ? Math.round((met / contracts) * 100) : 0

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/detail"
        meta={`${stats.length} joueur${stats.length !== 1 ? 's' : ''} · ${met} contrats remplis sur ${contracts} (${rate} %)`}
      />
      {finishedCount === 0 ? <StatsEmpty /> : <DetailTable stats={stats} />}
    </div>
  )
}
