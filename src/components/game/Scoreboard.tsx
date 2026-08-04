import type { GameState } from '@/types/game'
import { competitionRanks } from '@/lib/ranking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  game: GameState
}

export function Scoreboard({ game }: Props) {
  const sorted = [...game.players].sort((a, b) => b.totalScore - a.totalScore)
  const ranks = competitionRanks(sorted, (p) => p.totalScore)
  const currentRound = game.rounds.at(-1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Classement</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {game.phase === 'ASCENDING' ? '↑ Montée' : '↓ Descente'}
            </Badge>
            {currentRound && (
              <Badge variant="secondary">
                Manche {currentRound.number} · {currentRound.cardCount} carte{currentRound.cardCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sorted.map((player, index) => {
            const roundScore = currentRound?.scores.find((s) => s.playerId === player.id)
            const bet = currentRound?.bets.find((b) => b.playerId === player.id)
            const rank = ranks[index]!
            const isLeader = rank === 1

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-opacity ${isLeader && player.active ? 'bg-primary/10' : 'hover:bg-muted/50'} ${!player.active ? 'opacity-40' : ''}`}
              >
                <span className="w-5 text-sm text-muted-foreground font-mono">{rank}.</span>
                <span className="flex-1 font-medium text-sm">{player.name}</span>

                {bet && (
                  <span className="text-xs text-muted-foreground">
                    parie {bet.announced}
                    {bet.actual !== null && ` → ${bet.actual}`}
                  </span>
                )}

                {roundScore && (
                  <span className={`text-xs font-mono font-medium ${roundScore.points >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {roundScore.points >= 0 ? '+' : ''}{roundScore.points}
                  </span>
                )}

                <span className="font-bold font-mono text-sm w-14 text-right">
                  {player.totalScore}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
