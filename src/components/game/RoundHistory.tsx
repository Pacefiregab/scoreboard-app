import type { GameState } from '@/types/game'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  game: GameState
}

export function RoundHistory({ game }: Props) {
  const doneRounds = game.rounds.filter((r) => r.status === 'DONE')
  if (doneRounds.length === 0) return null

  const sortedPlayers = [...game.players].sort((a, b) => a.order - b.order)

  // Pre-compute score before each round for each player
  const scoreBefore = (playerId: string, roundIndex: number): number => {
    if (roundIndex === 0) {
      return game.players.find((p) => p.id === playerId)?.initialScore ?? 0
    }
    const prevRound = doneRounds[roundIndex - 1]
    return prevRound?.scores.find((s) => s.playerId === playerId)?.totalPoints ?? 0
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Historique</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-1">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground sticky left-0 bg-card min-w-24">
                  Joueur
                </th>
                {doneRounds.map((round) => (
                  <th
                    key={round.id}
                    className="px-3 py-2 font-medium text-muted-foreground text-center min-w-28 border-l"
                  >
                    <div>M{round.number}</div>
                    <div className="text-[10px] font-normal">{round.cardCount} carte{round.cardCount > 1 ? 's' : ''}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, playerIndex) => (
                <tr key={player.id} className={playerIndex % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className={`px-4 py-2 font-medium sticky left-0 z-10 border-r ${playerIndex % 2 === 0 ? 'bg-muted' : 'bg-card'}`}>
                    {player.name}
                  </td>
                  {doneRounds.map((round, roundIndex) => {
                    const bet = round.bets.find((b) => b.playerId === player.id)
                    const score = round.scores.find((s) => s.playerId === player.id)
                    const before = scoreBefore(player.id, roundIndex)
                    const after = score?.totalPoints ?? before
                    const success = bet && score && bet.actual === bet.announced

                    return (
                      <td key={round.id} className="px-3 py-2 border-l align-top">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex gap-2 text-muted-foreground">
                            <span>pari&nbsp;<span className="font-mono text-foreground">{bet?.announced ?? '—'}</span></span>
                            <span>plis&nbsp;<span className="font-mono text-foreground">{bet?.actual ?? '—'}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-mono font-semibold ${success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}
                            >
                              {score && score.points >= 0 ? '+' : ''}{score?.points ?? '—'}
                            </span>
                          </div>
                          <div className="text-muted-foreground font-mono">
                            {before} → {after}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
