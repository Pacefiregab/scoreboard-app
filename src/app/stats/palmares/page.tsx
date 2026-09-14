import Link from 'next/link'
import { listSeasons, getPlayerStats } from '@/lib/game-service'
import { resolveScoring } from '@/lib/scoring-choice'
import { rankByConfig, computeComposites } from '@/lib/scoring'
import { competitionRanks } from '@/lib/ranking'
import { inclusiveEnd } from '@/lib/season'
import { StatsPageHeader } from '@/components/stats/StatsPageHeader'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Palmarès des saisons' }

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)

const STATUS = {
  current: { label: 'en cours', className: 'border-primary/40 bg-primary/10 text-foreground' },
  upcoming: { label: 'à venir', className: 'border-border text-muted-foreground' },
  past: { label: 'terminée', className: 'border-border text-muted-foreground' },
} as const

function medal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

export default async function PalmaresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const [seasons, scoring] = await Promise.all([listSeasons(), resolveScoring(sp.methode)])
  const scoringConfig = scoring.config

  // Une passe de stats par saison : les volumes sont petits, et cela réutilise
  // exactement la méthode de classement configurée en admin.
  const podiums = await Promise.all(
    seasons.map(async (season) => {
      const stats = await getPlayerStats({
        finishedSince: season.startsAt,
        finishedBefore: season.endsAt,
      })
      if (stats.length === 0) return { season, podium: [] as { name: string; rank: number; wins: number }[] }

      const ranked = rankByConfig(stats, scoringConfig)
      const composites = computeComposites(stats, scoringConfig)
      const ranks = competitionRanks(ranked, (s) => {
        if (scoringConfig.method === 'C') return `${s.wins}|${s.avgFinalScore}|${s.contractRate}`
        if (scoringConfig.method === 'B') return `${s.f1Points}|${s.wins}`
        return String(composites.get(s.name) ?? 0)
      })

      const podium = ranked
        .map((s, i) => ({ name: s.name, rank: ranks[i]!, wins: s.wins }))
        .filter((p) => p.rank <= 3)

      return { season, podium }
    }),
  )

  return (
    <div className="space-y-5">
      <StatsPageHeader
        href="/stats/palmares"
        meta={`${seasons.length} saison${seasons.length !== 1 ? 's' : ''} définie${seasons.length !== 1 ? 's' : ''}`}
        method={
          scoring.allowChoice
            ? { selected: scoring.config.method, admin: scoring.adminMethod }
            : undefined
        }
      />

      {seasons.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aucune saison définie. Un administrateur peut les créer depuis la page admin —
          les saisons calendaires se génèrent en un clic et rattrapent l’historique.
        </div>
      ) : (
        <div className="space-y-3">
          {podiums.map(({ season, podium }) => {
            const status = STATUS[season.status]
            return (
              <div key={season.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-semibold">{season.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      Du {fmt(season.startsAt)} au {fmt(inclusiveEnd(season.endsAt))} ·{' '}
                      {season.gameCount} partie{season.gameCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {podium.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune partie terminée sur cette période.</p>
                ) : (
                  <div className="space-y-1">
                    {podium.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <span className="w-6 text-center shrink-0">{medal(p.rank) ?? `${p.rank}.`}</span>
                        <span className="flex-1 font-medium truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {p.wins} victoire{p.wins !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {season.gameCount > 0 && (
                  <Link
                    href={`/stats/classement?saison=${season.id}`}
                    className="inline-block text-xs text-primary hover:underline"
                  >
                    Voir le classement complet →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
