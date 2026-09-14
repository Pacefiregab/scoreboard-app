import { getPlayerStats, getScoringConfig } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { WeeklyRecap } from '@/components/WeeklyRecap'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Récap de la semaine' }

/** Monday 00:00 of the current week. */
function startOfWeek(now = new Date()): Date {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function WeeklyPage() {
  const weekStart = startOfWeek()

  const [weeklyStats, weeklyCount, scoringConfig] = await Promise.all([
    getPlayerStats({ finishedSince: weekStart }),
    prisma.game.count({ where: { status: 'FINISHED', finishedAt: { gte: weekStart } } }),
    getScoringConfig(),
  ])

  return (
    <WeeklyRecap
      stats={weeklyStats}
      gamesCount={weeklyCount}
      scoringConfig={scoringConfig}
      weekStart={weekStart}
    />
  )
}
