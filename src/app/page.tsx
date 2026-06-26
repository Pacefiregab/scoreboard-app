import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { JoinForm } from '@/components/JoinForm'
import { listActiveGames } from '@/lib/game-service'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const activeGames = await listActiveGames()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Scoreboard</h1>
        <p className="text-muted-foreground">Suivez vos parties de cartes</p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <Link href="/new" className="w-full">
          <Button size="lg" className="w-full">
            Créer une partie
          </Button>
        </Link>

        <div className="flex items-center gap-2 w-full">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <JoinForm />
      </div>

      {activeGames.length > 0 && (
        <div className="w-full max-w-xs space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Parties en cours
          </p>
          <div className="flex flex-col gap-2">
            {activeGames.map((game) => (
              <Link
                key={game.viewToken}
                href={`/view/${game.viewToken}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-muted transition-colors"
              >
                <Users size={16} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {game.playerNames.join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {game.roundNumber ? `Manche ${game.roundNumber}` : 'Pas encore commencée'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">Suivre →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
