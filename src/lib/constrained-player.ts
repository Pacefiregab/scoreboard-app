import type { GameState } from '@/types/game'

export function getNextRoundNumber(game: GameState): number {
  const lastRound = game.rounds.at(-1)
  if (!lastRound) return 1
  return lastRound.status === 'DONE' ? lastRound.number + 1 : lastRound.number
}

export function getConstrainedIndex(roundNumber: number, playerCount: number): number {
  if (playerCount === 0) return 0
  return (roundNumber - 2 + playerCount) % playerCount
}
