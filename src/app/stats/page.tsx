import Link from 'next/link'
import { getPlayerStats } from '@/lib/game-service'
import { prisma } from '@/lib/prisma'
import { StatsDisplay } from '@/components/StatsDisplay'
import { AppHeader } from '@/components/AppHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Statistiques' }

export default async function StatsPage() {
  const [stats, finishedCount] = await Promise.all([
    getPlayerStats(),
    prisma.game.count({ where: { status: 'FINISHED' } }),
  ])

  if (finishedCount === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader backHref="/" title="Statistiques" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="text-4xl">📊</div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold">Aucune statistique disponible</h1>
            <p className="text-muted-foreground text-sm">Les stats apparaissent après la fin d&apos;une partie.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/" title="Statistiques" />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pb-16 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {finishedCount} partie{finishedCount !== 1 ? 's' : ''} terminée{finishedCount !== 1 ? 's' : ''} · {stats.length} joueur{stats.length !== 1 ? 's' : ''}
          </p>
        </div>
        <StatsDisplay stats={stats} finishedCount={finishedCount} />
      </main>
    </div>
  )
}
