'use client'

import { useState, useMemo } from 'react'
import type { PlayerStat } from '@/lib/game-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Target, Star, Hash, Gamepad2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const PAGE_SIZE = 10

type SortKey = keyof PlayerStat
type SortDir = 'asc' | 'desc'

function sortStats(stats: PlayerStat[], key: SortKey, dir: SortDir): PlayerStat[] {
  return [...stats].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return dir === 'asc' ? cmp : -cmp
  })
}

function medal(rank: number) {
  if (rank === 0) return '🥇'
  if (rank === 1) return '🥈'
  if (rank === 2) return '🥉'
  return null
}

function pct(n: number) {
  return `${Math.round(n * 100)} %`
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="opacity-30 group-hover:opacity-70 transition-opacity" />
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

function Th({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  right = false,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  currentDir: SortDir
  onSort: (k: SortKey) => void
  right?: boolean
}) {
  const active = currentKey === sortKey
  return (
    <th className={`px-4 py-3 font-medium ${right ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 hover:text-foreground transition-colors ${right ? 'flex-row-reverse' : ''} ${active ? 'text-foreground' : ''}`}
      >
        {label}
        <SortIcon active={active} dir={currentDir} />
      </button>
    </th>
  )
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm pt-3 border-t mt-1">
      <span className="text-muted-foreground">Page {page} / {total}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page === 1}>
          ← Précédent
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page === total}>
          Suivant →
        </Button>
      </div>
    </div>
  )
}

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

interface Props {
  stats: PlayerStat[]
  finishedCount: number
}

export function StatsDisplay({ stats, finishedCount }: Props) {
  // Ranking table sort
  const [rankKey, setRankKey] = useState<SortKey>('wins')
  const [rankDir, setRankDir] = useState<SortDir>('desc')
  const [rankPage, setRankPage] = useState(1)

  // Stats table sort
  const [statsKey, setStatsKey] = useState<SortKey>('wins')
  const [statsDir, setStatsDir] = useState<SortDir>('desc')
  const [statsPage, setStatsPage] = useState(1)

  function handleRankSort(key: SortKey) {
    if (key === rankKey) setRankDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setRankKey(key); setRankDir('desc') }
    setRankPage(1)
  }

  function handleStatsSort(key: SortKey) {
    if (key === statsKey) setStatsDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setStatsKey(key); setStatsDir('desc') }
    setStatsPage(1)
  }

  const rankSorted = useMemo(() => sortStats(stats, rankKey, rankDir), [stats, rankKey, rankDir])
  const statsSorted = useMemo(() => sortStats(stats, statsKey, statsDir), [stats, statsKey, statsDir])

  const totalRankPages = Math.ceil(stats.length / PAGE_SIZE)
  const totalStatsPages = Math.ceil(stats.length / PAGE_SIZE)

  const rankSlice = rankSorted.slice((rankPage - 1) * PAGE_SIZE, rankPage * PAGE_SIZE)
  const statsSlice = statsSorted.slice((statsPage - 1) * PAGE_SIZE, statsPage * PAGE_SIZE)

  const rankThProps = { currentKey: rankKey, currentDir: rankDir, onSort: handleRankSort }
  const statsThProps = { currentKey: statsKey, currentDir: statsDir, onSort: handleStatsSort }

  return (
    <div className="space-y-8">

      {/* ── Classement général ── */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          Classement général
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {stats.length} joueur{stats.length !== 1 ? 's' : ''}
          </span>
        </h2>

        <div className="rounded-xl border overflow-hidden">
          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-10">#</th>
                  <Th label="Joueur"        sortKey="name"          {...rankThProps} />
                  <Th label="Victoires"     sortKey="wins"          {...rankThProps} right />
                  <Th label="Taux victoire" sortKey="winRate"       {...rankThProps} right />
                  <Th label="Parties"       sortKey="gamesPlayed"   {...rankThProps} right />
                  <Th label="Score moy."    sortKey="avgFinalScore" {...rankThProps} right />
                  <Th label="Record"        sortKey="bestScore"     {...rankThProps} right />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rankSlice.map((s, i) => {
                  const globalRank = (rankPage - 1) * PAGE_SIZE + i
                  const isFirst = rankKey === 'wins' && rankDir === 'desc' && globalRank === 0
                  return (
                    <tr key={s.name} className={`hover:bg-muted/30 transition-colors ${isFirst ? 'bg-yellow-50/40 dark:bg-yellow-950/10' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-center">
                        {rankKey === 'wins' && rankDir === 'desc' ? (medal(globalRank) ?? `${globalRank + 1}.`) : `${globalRank + 1}.`}
                      </td>
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-right font-bold">{s.wins}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{pct(s.winRate)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{s.gamesPlayed}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{s.avgFinalScore}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{s.bestScore}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile — tri par boutons compacts */}
          <div className="sm:hidden">
            <div className="flex gap-1.5 flex-wrap px-3 pt-3 pb-2 border-b">
              {([
                ['wins', 'Victoires'],
                ['winRate', 'Taux'],
                ['gamesPlayed', 'Parties'],
                ['avgFinalScore', 'Moy.'],
                ['bestScore', 'Record'],
                ['name', 'Nom'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleRankSort(key)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                    rankKey === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {label}
                  {rankKey === key && (rankDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              ))}
            </div>
            <div className="divide-y">
              {rankSlice.map((s, i) => {
                const globalRank = (rankPage - 1) * PAGE_SIZE + i
                return (
                  <div key={s.name} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-7 text-center text-sm font-mono shrink-0">
                      {rankKey === 'wins' && rankDir === 'desc' ? (medal(globalRank) ?? `${globalRank + 1}.`) : `${globalRank + 1}.`}
                    </span>
                    <span className="flex-1 font-medium text-sm truncate">{s.name}</span>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">{s.wins} <span className="font-normal text-muted-foreground text-xs">V</span></p>
                      <p className="text-xs text-muted-foreground">{s.gamesPlayed} partie{s.gamesPlayed !== 1 ? 's' : ''} · {pct(s.winRate)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {totalRankPages > 1 && (
            <div className="px-4 py-3 border-t">
              <Pagination page={rankPage} total={totalRankPages} onChange={(p) => { setRankPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Stats détaillées ── */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <TrendingUp size={16} />
          Stats détaillées
        </h2>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {([
              ['wins', 'Victoires'],
              ['contractRate', 'Contrats'],
              ['gamesPlayed', 'Parties'],
              ['roundsPlayed', 'Manches'],
              ['avgFinalScore', 'Moy.'],
              ['bestScore', 'Record'],
              ['name', 'Nom'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleStatsSort(key)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                  statsKey === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {label}
                {statsKey === key && (statsDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
              </button>
            ))}
          </div>
          {statsSlice.map((s, i) => {
            const globalRank = (statsPage - 1) * PAGE_SIZE + i
            return (
              <Card key={s.name}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {statsKey === 'wins' && statsDir === 'desc' && medal(globalRank)
                      ? <span>{medal(globalRank)}</span>
                      : <span className="text-muted-foreground font-mono text-xs">{globalRank + 1}.</span>}
                    {s.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  <StatCell icon={<Gamepad2 size={12} />} label="Parties"   value={String(s.gamesPlayed)} />
                  <StatCell icon={<Trophy size={12} />}   label="Victoires" value={`${s.wins} (${pct(s.winRate)})`} />
                  <StatCell icon={<Target size={12} />}   label="Contrats"  value={`${s.betsWon}/${s.roundsPlayed} (${pct(s.contractRate)})`} />
                  <StatCell icon={<Hash size={12} />}     label="Manches"   value={String(s.roundsPlayed)} />
                  <StatCell icon={<TrendingUp size={12} />} label="Score moy." value={String(s.avgFinalScore)} />
                  <StatCell icon={<Star size={12} />}     label="Record"    value={String(s.bestScore)} />
                </CardContent>
              </Card>
            )
          })}
          {totalStatsPages > 1 && (
            <Pagination page={statsPage} total={totalStatsPages} onChange={setStatsPage} />
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-10">#</th>
                  <Th label="Joueur"        sortKey="name"          {...statsThProps} />
                  <Th label="Parties"       sortKey="gamesPlayed"   {...statsThProps} right />
                  <Th label="Victoires"     sortKey="wins"          {...statsThProps} right />
                  <Th label="Taux victoire" sortKey="winRate"       {...statsThProps} right />
                  <Th label="Manches"       sortKey="roundsPlayed"  {...statsThProps} right />
                  <Th label="Contrats"      sortKey="betsWon"       {...statsThProps} right />
                  <Th label="Taux contrat"  sortKey="contractRate"  {...statsThProps} right />
                  <Th label="Score moy."    sortKey="avgFinalScore" {...statsThProps} right />
                  <Th label="Record"        sortKey="bestScore"     {...statsThProps} right />
                </tr>
              </thead>
              <tbody className="divide-y">
                {statsSlice.map((s, i) => {
                  const globalRank = (statsPage - 1) * PAGE_SIZE + i
                  return (
                    <tr key={s.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-center">
                        {statsKey === 'wins' && statsDir === 'desc' ? (medal(globalRank) ?? `${globalRank + 1}.`) : `${globalRank + 1}.`}
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
          {totalStatsPages > 1 && (
            <div className="px-4 py-3 border-t">
              <Pagination page={statsPage} total={totalStatsPages} onChange={setStatsPage} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
