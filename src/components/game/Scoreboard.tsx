import type { GameState } from '@/types/game'
import { getStandings } from '@/lib/ranking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { BonusX2Badge } from './BonusX2Badge'

interface Props {
  game: GameState
}

export function Scoreboard({ game }: Props) {
  const standings = getStandings(game)
  const currentRound = game.rounds.at(-1)

  // Bets only exist once the admin has validated them, so their presence marks
  // the moment this total becomes public. The rules forbid the announced total
  // from equalling the card count, so it is always over or under — never level.
  const announced = currentRound?.bets.length
    ? currentRound.bets.reduce((sum, b) => sum + b.announced, 0)
    : null
  const gap = announced !== null && currentRound ? announced - currentRound.cardCount : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Classement</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              {game.phase === 'ASCENDING' ? '↑ Montée' : '↓ Descente'}
            </Badge>
            {currentRound && (
              <Badge variant="secondary">
                Manche {currentRound.number} · {currentRound.cardCount} carte{currentRound.cardCount > 1 ? 's' : ''}
              </Badge>
            )}
            {announced !== null && currentRound && (
              <Tooltip
                side="bottom"
                label={`${announced} pli${announced > 1 ? 's' : ''} annoncé${announced > 1 ? 's' : ''} pour ${currentRound.cardCount} carte${currentRound.cardCount > 1 ? 's' : ''} — ${gap > 0 ? 'sur-enchère' : 'sous-enchère'}`}
              >
                <Badge variant="outline">
                  {announced} pli{announced > 1 ? 's' : ''} annoncé{announced > 1 ? 's' : ''} · {gap > 0 ? `+${gap}` : gap}
                </Badge>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {standings.map(({ player, rank, contractRate, contractsWon, roundsPlayed, tied }) => {
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

                {/* Shown on tied players: it explains their order within the group */}
                {tied && roundsPlayed > 0 && (
                  <Tooltip
                    label={`${contractsWon}/${roundsPlayed} contrats réussis — départage l’ordre entre ex æquo`}
                  >
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {Math.round(contractRate * 100)} %
                    </span>
                  </Tooltip>
                )}

                {bet?.bonusX2 && <BonusX2Badge />}

                {player.penaltyPoints > 0 && (
                  <Tooltip label={`${player.penaltyPoints} points retirés en pénalités`}>
                    <span className="shrink-0 text-[10px] font-mono font-medium text-destructive">
                      −{player.penaltyPoints}
                    </span>
                  </Tooltip>
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
