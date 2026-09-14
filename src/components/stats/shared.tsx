'use client'

import type { PlayerStat } from '@/lib/game-service'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export type ColKey = keyof PlayerStat
export type SortDir = 'asc' | 'desc'
/** `auto` = the ranking method configured in admin, rather than a column sort. */
export type RankMode = ColKey | 'auto'

/** Choices offered by the page-size selector; `0` means everything. */
export const PAGE_SIZES = [10, 25, 50, 0] as const
export const DEFAULT_PAGE_SIZE = 10

export function sortStats(stats: PlayerStat[], key: ColKey, dir: SortDir): PlayerStat[] {
  return [...stats].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return dir === 'asc' ? cmp : -cmp
  })
}

/** `rank` is 1-based; tied players share a medal and the next one is skipped. */
export function medal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

export function pct(n: number) {
  return `${Math.round(n * 100)} %`
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="opacity-30 group-hover:opacity-70 transition-opacity" />
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

export function Th({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  right = false,
}: {
  label: string
  sortKey: ColKey
  currentKey: RankMode
  currentDir: SortDir
  onSort: (k: ColKey) => void
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

/** Compact sort chips used instead of table headers on small screens. */
export function SortChips({
  options,
  currentKey,
  currentDir,
  onSort,
  children,
}: {
  options: [ColKey, string][]
  currentKey: RankMode
  currentDir: SortDir
  onSort: (k: ColKey) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
            currentKey === key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          {label}
          {currentKey === key && (currentDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
        </button>
      ))}
      {children}
    </div>
  )
}

export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      Par page
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>
            {n === 0 ? 'Tout' : n}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number
  total: number
  onChange: (p: number) => void
}) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm">
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

/**
 * Slicing shared by every paginated view. A size of 0 shows everything, and the
 * page is clamped so shrinking the list never strands the reader on an empty page.
 */
export function paginate<T>(items: T[], page: number, size: number) {
  const totalPages = size === 0 ? 1 : Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, totalPages)
  const slice = size === 0 ? items : items.slice((current - 1) * size, current * size)
  return { slice, totalPages, current, offset: size === 0 ? 0 : (current - 1) * size }
}
