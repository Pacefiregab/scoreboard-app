'use client'

import { useState, useMemo } from 'react'
import type { PlayerStat } from '@/lib/game-service'
import { competitionRanks } from '@/lib/ranking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  sortStats, medal, pct, Th, SortChips, Pagination, PageSizeSelect, paginate,
  DEFAULT_PAGE_SIZE, type ColKey, type SortDir,
} from './shared'
import { Trophy, TrendingUp, Target, Star, Hash, Gamepad2 } from 'lucide-react'

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function DetailTable({ stats }: { stats: PlayerStat[] }) {
  const [key, setKey] = useState<ColKey>('wins')
  const [dir, setDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  function handleSort(k: ColKey) {
    if (k === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setKey(k); setDir('desc') }
    setPage(1)
  }

  const sorted = useMemo(() => sortStats(stats, key, dir), [stats, key, dir])
  const ranks = useMemo(
    () => competitionRanks(sorted, (s) => String(s[key])),
    [sorted, key],
  )

  const { slice, totalPages, current, offset } = paginate(sorted, page, pageSize)
  const thProps = { currentKey: key, currentDir: dir, onSort: handleSort }
  const medalsShown = key === 'wins' && dir === 'desc'

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PageSizeSelect value={pageSize} onChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        <SortChips
          options={[
            ['wins', 'Victoires'],
            ['contractRate', 'Contrats'],
            ['gamesPlayed', 'Parties'],
            ['roundsPlayed', 'Manches'],
            ['avgFinalScore', 'Moy.'],
            ['bestScore', 'Record'],
            ['name', 'Nom'],
          ]}
          currentKey={key}
          currentDir={dir}
          onSort={handleSort}
        />
        {slice.map((s, i) => {
          const rank = ranks[offset + i]!
          return (
            <Card key={s.name}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  {medalsShown && medal(rank)
                    ? <span>{medal(rank)}</span>
                    : <span className="text-muted-foreground font-mono text-xs">{rank}.</span>}
                  {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-2">
                <StatCell icon={<Gamepad2 size={12} />}   label="Parties"    value={String(s.gamesPlayed)} />
                <StatCell icon={<Trophy size={12} />}     label="Victoires"  value={`${s.wins} (${pct(s.winRate)})`} />
                <StatCell icon={<Target size={12} />}     label="Contrats"   value={`${s.betsWon}/${s.roundsPlayed} (${pct(s.contractRate)})`} />
                <StatCell icon={<Hash size={12} />}       label="Manches"    value={String(s.roundsPlayed)} />
                <StatCell icon={<TrendingUp size={12} />} label="Score moy." value={String(s.avgFinalScore)} />
                <StatCell icon={<Star size={12} />}       label="Record"     value={String(s.bestScore)} />
              </CardContent>
            </Card>
          )
        })}
        {totalPages > 1 && <Pagination page={current} total={totalPages} onChange={setPage} />}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-10">#</th>
                <Th label="Joueur"        sortKey="name"          {...thProps} />
                <Th label="Parties"       sortKey="gamesPlayed"   {...thProps} right />
                <Th label="Victoires"     sortKey="wins"          {...thProps} right />
                <Th label="Taux victoire" sortKey="winRate"       {...thProps} right />
                <Th label="Manches"       sortKey="roundsPlayed"  {...thProps} right />
                <Th label="Contrats"      sortKey="betsWon"       {...thProps} right />
                <Th label="Taux contrat"  sortKey="contractRate"  {...thProps} right />
                <Th label="Score moy."    sortKey="avgFinalScore" {...thProps} right />
                <Th label="Record"        sortKey="bestScore"     {...thProps} right />
              </tr>
            </thead>
            <tbody className="divide-y">
              {slice.map((s, i) => {
                const rank = ranks[offset + i]!
                return (
                  <tr key={s.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-center">
                      {medalsShown ? (medal(rank) ?? `${rank}.`) : `${rank}.`}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.gamesPlayed}</td>
                    <td className="px-4 py-3 text-right font-bold">{s.wins}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{pct(s.winRate)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.roundsPlayed}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.betsWon}/{s.roundsPlayed}</td>
                    <td className={`px-4 py-3 text-right font-medium ${s.contractRate >= 0.5 ? 'text-green-600 dark:text-green-400' : s.contractRate < 0.3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {pct(s.contractRate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{s.avgFinalScore}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{s.bestScore}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t">
            <Pagination page={current} total={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
