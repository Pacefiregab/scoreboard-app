import type { GameState } from '@/types/game'
import { getStandings } from '@/lib/ranking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  game: GameState
}

export function Scoreboard({ game }: Props) {
  const standings = getStandings(game)
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
          {standings.map(({ player, rank, contractRate, contractsWon, roundsPlayed, scoreTied }) => {
            const roundScore = currentRound?.scores.find((s) => s.playerId === player.id)
            const bet = currentRound?.bets.find((b) => b.playerId === player.id)
            const isLeader = rank === 1

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-opacity ${isLeader && player.active ? 'bg-primary/10' : 'hover:bg-muted/50'} ${!player.active ? 'opacity-40' : ''}`}
              >
                <span className="w-5 text-sm text-muted-foreground font-mono">{rank}.</span>
                <span className="flex-1 font-medium text-sm">{player.name}</span>

                {/* Shown only when the rate is what separated equal scores */}
                {scoreTied && roundsPlayed > 0 && (
                  <span
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0"
                    title={`${contractsWon}/${roundsPlayed} contrats réussis — départage à égalité de score`}
                  >
                    {Math.round(contractRate * 100)} %
                  </span>
                )}

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
