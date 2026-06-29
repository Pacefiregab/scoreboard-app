import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGame } from '@/lib/game-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WinnerEffect } from '@/components/WinnerEffect'

export default async function SummaryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let game
  try {
    game = await getGame(token)
  } catch {
    notFound()
  }

  const sorted = [...game.players].sort((a, b) => b.totalScore - a.totalScore)
  const winner = sorted[0]!

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto space-y-4 pb-8">
      <WinnerEffect name={winner.name} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Classement final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((player, rank) => (
            <div key={player.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${rank === 0 ? 'bg-primary/10' : ''}`}>
              <span className="w-5 text-sm text-muted-foreground">{rank + 1}.</span>
              <span className="flex-1 font-medium">{player.name}</span>
              {rank === 0 && <Badge>Vainqueur</Badge>}
              <span className="font-bold font-mono">{player.totalScore}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Détail des manches ({game.rounds.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {game.rounds.map((round) => (
            <div key={round.id}>
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                Manche {round.number} · {round.cardCount} carte{round.cardCount > 1 ? 's' : ''}
              </p>
              <div className="space-y-0.5">
                {[...game.players]
                  .sort((a, b) => a.order - b.order)
                  .map((player) => {
                    const bet = round.bets.find((b) => b.playerId === player.id)
                    const score = round.scores.find((s) => s.playerId === player.id)
                    if (!bet || !score) return null
                    const success = bet.actual === bet.announced

                    return (
                      <div key={player.id} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 text-muted-foreground">{player.name}</span>
                        <span className="text-muted-foreground">{bet.announced} → {bet.actual}</span>
                        <span className={`w-10 text-right font-mono font-medium ${success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {score.points >= 0 ? '+' : ''}{score.points}
                        </span>
                        <span className="w-14 text-right font-mono text-muted-foreground">{score.totalPoints}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Link href="/new">
        <Button className="w-full">Nouvelle partie</Button>
      </Link>
    </main>
  )
}
