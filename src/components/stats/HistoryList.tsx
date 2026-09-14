'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FinishedGameSummary } from '@/lib/game-service'
import { Pagination, PageSizeSelect, paginate, DEFAULT_PAGE_SIZE } from './shared'
import { ChevronRight } from 'lucide-react'

interface Props {
  /** Dates are serialised across the server boundary. */
  games: (Omit<FinishedGameSummary, 'finishedAt'> & { finishedAt: string })[]
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function HistoryList({ games }: Props) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { slice, totalPages, current } = paginate(games, page, pageSize)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {games.length} partie{games.length !== 1 ? 's' : ''} terminée{games.length !== 1 ? 's' : ''}
        </span>
        <PageSizeSelect value={pageSize} onChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>

      <div className="rounded-xl border overflow-hidden divide-y">
        {slice.map((game) => {
          const winners = game.players.filter((p) => p.isWinner)
          return (
            <Link
              key={game.viewToken}
              href={`/game/${game.viewToken}/summary`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {winners.map((w) => w.name).join(', ')}
                  <span className="font-normal text-muted-foreground">
                    {winners.length > 1 ? ' l’emportent' : ' l’emporte'} avec {winners[0]?.score ?? 0}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatDate(game.finishedAt)} · {game.players.length} joueurs · {game.roundCount} manche
                  {game.roundCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                  {game.players.map((p) => `${p.name} ${p.score}`).join(' · ')}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </Link>
          )
        })}
      </div>

      {totalPages > 1 && <Pagination page={current} total={totalPages} onChange={setPage} />}
    </div>
  )
}
