import type { PlayerStat } from '@/lib/game-service'
import { rankByConfig, computeComposites, type ScoringConfig } from '@/lib/scoring'
import { CalendarDays, Crown, Gamepad2, Star, Target } from 'lucide-react'

interface Props {
  stats: PlayerStat[]
  gamesCount: number
  scoringConfig: ScoringConfig
  weekStart: Date
}

function fmtDay(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d)
}

function pct(n: number) {
  return `${Math.round(n * 100)} %`
}

function medal(rank: number) {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

function HighlightCard({ icon, label, value, detail }: {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-semibold truncate">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}

export function WeeklyRecap({ stats, gamesCount, scoringConfig, weekStart }: Props) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const title = (
    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
      <CalendarDays size={16} className="text-primary" />
      Récap de la semaine
      <span className="text-xs font-normal text-muted-foreground ml-1">
        du {fmtDay(weekStart)} au {fmtDay(weekEnd)}
      </span>
    </h2>
  )

  if (gamesCount === 0 || stats.length === 0) {
    return (
      <div>
        {title}
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aucune partie terminée cette semaine — le récap apparaîtra après la première partie.
        </div>
      </div>
    )
  }

  const ranked = rankByConfig(stats, scoringConfig)
  const composites = computeComposites(stats, scoringConfig)
  const top = ranked[0]!

  const topDetail =
    scoringConfig.method === 'B' ? `${top.f1Points} pts F1`
    : scoringConfig.method === 'A' ? `${composites.get(top.name) ?? 0} / 100`
    : `${top.wins} victoire${top.wins !== 1 ? 's' : ''}`

  const bestScorer = stats.reduce((best, s) => (s.bestScore > best.bestScore ? s : best))
  const bestContract = stats.reduce((best, s) => (s.contractRate > best.contractRate ? s : best))

  function rankValue(s: PlayerStat): string {
    if (scoringConfig.method === 'B') return `${s.f1Points} pts`
    if (scoringConfig.method === 'A') return `${composites.get(s.name) ?? 0} / 100`
    return `${s.wins} V`
  }

  return (
    <div>
      {title}

      <div className="space-y-3">
        {/* Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HighlightCard
            icon={<Crown size={12} />}
            label="Joueur de la semaine"
            value={top.name}
            detail={topDetail}
          />
          <HighlightCard
            icon={<Gamepad2 size={12} />}
            label="Parties jouées"
            value={String(gamesCount)}
            detail={`${stats.length} joueur${stats.length !== 1 ? 's' : ''}`}
          />
          <HighlightCard
            icon={<Star size={12} />}
            label="Meilleur score"
            value={String(bestScorer.bestScore)}
            detail={bestScorer.name}
          />
          <HighlightCard
            icon={<Target size={12} />}
            label="Meilleur taux contrats"
            value={pct(bestContract.contractRate)}
            detail={bestContract.name}
          />
        </div>

        {/* Podium of the week */}
        <div className="rounded-xl border overflow-hidden">
          <div className="divide-y">
            {ranked.slice(0, 5).map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-7 text-center text-sm font-mono shrink-0">
                  {medal(i) ?? `${i + 1}.`}
                </span>
                <span className="flex-1 font-medium text-sm truncate">{s.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {s.gamesPlayed} partie{s.gamesPlayed !== 1 ? 's' : ''} · {s.wins} V
                </span>
                <span className="text-sm font-mono font-medium text-primary shrink-0 w-20 text-right">
                  {rankValue(s)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
