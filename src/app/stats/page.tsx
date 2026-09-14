import { getPlayerStats, getScoringConfig } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { WeeklyRecap } from '@/components/WeeklyRecap'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

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

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const day = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d)

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats"
        meta={`Du ${day(weekStart)} au ${day(weekEnd)} · ${weeklyCount} partie${weeklyCount !== 1 ? 's' : ''} terminée${weeklyCount !== 1 ? 's' : ''}`}
      />
      <WeeklyRecap stats={weeklyStats} gamesCount={weeklyCount} scoringConfig={scoringConfig} />
    </div>
  )
}
