import Link from 'next/link'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { listAllGamesAdmin, type AdminGameSummary } from '@/lib/game-service'
import { Button } from '@/components/ui/button'
import { DeleteGameButton } from './DeleteGameButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

type SortKey = 'players' | 'status' | 'rounds' | 'created' | 'activity'
type SortOrder = 'asc' | 'desc'

function fmt(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

function sortGames(games: AdminGameSummary[], sort: SortKey, order: SortOrder) {
  return [...games].sort((a, b) => {
    let cmp = 0
    if (sort === 'players') cmp = (a.playerNames[0] ?? '').localeCompare(b.playerNames[0] ?? '')
    else if (sort === 'status') cmp = a.status.localeCompare(b.status)
    else if (sort === 'rounds') cmp = a.roundCount - b.roundCount
    else if (sort === 'created') cmp = a.createdAt.getTime() - b.createdAt.getTime()
    else if (sort === 'activity') cmp = a.lastActivity.getTime() - b.lastActivity.getTime()
    return order === 'asc' ? cmp : -cmp
  })
}

function buildQuery(current: Record<string, string>, overrides: Record<string, string>) {
  const p = new URLSearchParams({ ...current, ...overrides })
  return p.toString()
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  rawParams,
}: {
  label: string
  sortKey: SortKey
  currentSort: SortKey
  currentOrder: SortOrder
  rawParams: Record<string, string>
}) {
  const isActive = currentSort === sortKey
  const nextOrder: SortOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc'
  const href = `/admin?${buildQuery(rawParams, { sort: sortKey, order: nextOrder, page: '1' })}`

  return (
    <Link href={href} className="flex items-center gap-1 hover:text-foreground transition-colors group">
      {label}
      {isActive
        ? currentOrder === 'asc'
          ? <ChevronUp size={13} />
          : <ChevronDown size={13} />
        : <ChevronsUpDown size={13} className="opacity-30 group-hover:opacity-60" />}
    </Link>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const sort = (sp.sort ?? 'created') as SortKey
  const order = (sp.order ?? 'desc') as SortOrder
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))

  const allGames = await listAllGamesAdmin()
  const sorted = sortGames(allGames, sort, order)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const games = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const rawParams = { sort, order, page: String(currentPage) }
  const headerProps = { currentSort: sort, currentOrder: order, rawParams }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allGames.length} partie{allGames.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Accueil
        </Link>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">
                <SortHeader label="Joueurs" sortKey="players" {...headerProps} />
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <SortHeader label="Statut" sortKey="status" {...headerProps} />
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <SortHeader label="Manches" sortKey="rounds" {...headerProps} />
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <SortHeader label="Créée le" sortKey="created" {...headerProps} />
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <SortHeader label="Dernière activité" sortKey="activity" {...headerProps} />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium max-w-xs truncate">{game.playerNames.join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 space-x-2">
                    <Link href={`/game/${game.adminToken}`} className="hover:underline">Admin</Link>
                    <span>·</span>
                    <Link href={`/view/${game.viewToken}`} className="hover:underline">Spectateur</Link>
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    game.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {game.status === 'ACTIVE' ? 'En cours' : 'Terminée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {game.roundCount > 0 ? game.roundCount : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {fmt(game.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {fmt(game.lastActivity)}
                </td>
                <td className="px-4 py-3">
                  <DeleteGameButton id={game.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {allGames.length === 0 && (
          <p className="text-center py-12 text-muted-foreground text-sm">Aucune partie</p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <p className="text-muted-foreground">
              Page {currentPage} / {totalPages} — {allGames.length} parties
            </p>
            <div className="flex gap-2">
              {currentPage > 1
                ? <Link href={`/admin?${buildQuery(rawParams, { page: String(currentPage - 1) })}`}>
                    <Button variant="outline" size="sm">← Précédent</Button>
                  </Link>
                : <Button variant="outline" size="sm" disabled>← Précédent</Button>}
              {currentPage < totalPages
                ? <Link href={`/admin?${buildQuery(rawParams, { page: String(currentPage + 1) })}`}>
                    <Button variant="outline" size="sm">Suivant →</Button>
                  </Link>
                : <Button variant="outline" size="sm" disabled>Suivant →</Button>}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
