'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Home } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { GameContext } from '@/context/GameContext'
import { GameMenu } from '@/components/game/GameMenu'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function GameTokenLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const token = params.token as string
  const { game, loading, error, refresh } = useGame(token)

  return (
    <GameContext.Provider value={{ game, loading, error, refresh }}>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Home size={15} />
              <span className="text-sm hidden sm:inline">Accueil</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-semibold flex-1">Scoreboard</span>
            <ThemeToggle />
            {game?.isAdmin && game.status === 'ACTIVE' && (
              <GameMenu game={game} onAction={refresh} />
            )}
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </GameContext.Provider>
  )
}
