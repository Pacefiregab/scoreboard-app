'use client'

import { useState, useMemo } from 'react'
import type { PlayerStat } from '@/lib/game-service'
import { rankByConfig, computeComposites, METHOD_META, type ScoringConfig } from '@/lib/scoring'
import { competitionRanks } from '@/lib/ranking'
import {
  sortStats, medal, pct, Th, SortChips, Pagination, PageSizeSelect, paginate,
  DEFAULT_PAGE_SIZE, type ColKey, type SortDir, type RankMode,
} from './shared'
import { Settings2 } from 'lucide-react'

interface Props {
  stats: PlayerStat[]
  scoringConfig: ScoringConfig
}

export function RankingTable({ stats, scoringConfig }: Props) {
  const [mode, setMode] = useState<RankMode>('auto')
  const [dir, setDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  function handleSort(key: ColKey) {
    if (key === mode) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setMode(key); setDir('desc') }
    setPage(1)
  }

  function resetSort() {
    setMode('auto')
    setDir('desc')
    setPage(1)
  }

  const composites = useMemo(
    () => computeComposites(stats, scoringConfig),
    [stats, scoringConfig],
  )

  const sorted = useMemo(() => {
    if (mode === 'auto') return rankByConfig(stats, scoringConfig)
    return sortStats(stats, mode, dir)
  }, [stats, mode, dir, scoringConfig])

  // Ranks are computed on the whole sorted list, then indexed per page. Two
  // players are tied only when they match on everything the active sort uses.
  const ranks = useMemo(() => {
    const key = (s: PlayerStat): string => {
      if (mode !== 'auto') return String(s[mode])
      if (scoringConfig.method === 'C') return `${s.wins}|${s.avgFinalScore}|${s.contractRate}`
      if (scoringConfig.method === 'B') return `${s.f1Points}|${s.wins}`
      return String(composites.get(s.name) ?? 0)
    }
    return competitionRanks(sorted, key)
  }, [sorted, mode, scoringConfig, composites])

  const { slice, totalPages, current, offset } = paginate(sorted, page, pageSize)

  const showExtra = scoringConfig.method !== 'C'
  const extraLabel = scoringConfig.method === 'B' ? 'Pts F1' : 'Score'
  const isAuto = mode === 'auto'

  function extraValue(s: PlayerStat): string {
    if (scoringConfig.method === 'B') return String(s.f1Points)
    if (scoringConfig.method === 'A') return `${composites.get(s.name) ?? 0} / 100`
    return ''
  }

  const thProps = { currentKey: mode, currentDir: dir, onSort: handleSort }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Settings2 size={11} />
          Méthode&nbsp;: <strong className="text-foreground">{METHOD_META[scoringConfig.method].label}</strong>
        </span>
        <PageSizeSelect value={pageSize} onChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>

      <div className="rounded-xl border overflow-hidden">
        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-10">#</th>
                <Th label="Joueur"        sortKey="name"          {...thProps} />
                <Th label="Victoires"     sortKey="wins"          {...thProps} right />
                <Th label="Taux victoire" sortKey="winRate"       {...thProps} right />
                <Th label="Parties"       sortKey="gamesPlayed"   {...thProps} right />
                <Th label="Score moy."    sortKey="avgFinalScore" {...thProps} right />
                <Th label="Record"        sortKey="bestScore"     {...thProps} right />
                {showExtra && (
                  <Th
                    label={extraLabel}
                    sortKey={scoringConfig.method === 'B' ? 'f1Points' : 'winRate'}
                    currentKey={mode}
                    currentDir={dir}
                    onSort={scoringConfig.method === 'B' ? handleSort : () => {}}
                    right
                  />
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {slice.map((s, i) => {
                const rank = ranks[offset + i]!
                const isTop = isAuto && rank === 1
                return (
                  <tr key={s.name} className={`hover:bg-muted/30 transition-colors ${isTop ? 'bg-yellow-50/40 dark:bg-yellow-950/10' : ''}`}>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-center">
                      {isAuto ? (medal(rank) ?? `${rank}.`) : `${rank}.`}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right font-bold">{s.wins}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{pct(s.winRate)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.gamesPlayed}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{s.avgFinalScore}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{s.bestScore}</td>
                    {showExtra && (
                      <td className="px-4 py-3 text-right font-mono font-medium text-primary">
                        {extraValue(s)}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden">
          <div className="px-3 pt-3 pb-2 border-b">
            <SortChips
              options={[
                ['wins', 'Victoires'],
                ['winRate', 'Taux'],
                ['gamesPlayed', 'Parties'],
                ['avgFinalScore', 'Moy.'],
                ['bestScore', 'Record'],
                ...(scoringConfig.method === 'B' ? ([['f1Points', 'F1']] as [ColKey, string][]) : []),
                ['name', 'Nom'],
              ]}
              currentKey={mode}
              currentDir={dir}
              onSort={handleSort}
            >
              {!isAuto && (
                <button
                  onClick={resetSort}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-primary text-primary transition-colors hover:bg-primary/10"
                >
                  ↺ Auto
                </button>
              )}
            </SortChips>
          </div>
          <div className="divide-y">
            {slice.map((s, i) => {
              const rank = ranks[offset + i]!
              return (
                <div key={s.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-7 text-center text-sm font-mono shrink-0">
                    {isAuto ? (medal(rank) ?? `${rank}.`) : `${rank}.`}
                  </span>
                  <span className="flex-1 font-medium text-sm truncate">{s.name}</span>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">
                      {s.wins} <span className="font-normal text-muted-foreground text-xs">V</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.gamesPlayed} partie{s.gamesPlayed !== 1 ? 's' : ''} · {pct(s.winRate)}
                      {showExtra && ` · ${extraValue(s)}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t">
            <Pagination page={current} total={totalPages} onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }} />
          </div>
        )}
      </div>

      {!isAuto && (
        <button onClick={resetSort} className="hidden sm:inline text-xs text-primary hover:underline">
          ← Revenir au classement par {METHOD_META[scoringConfig.method].label.toLowerCase()}
        </button>
      )}
    </div>
  )
}
