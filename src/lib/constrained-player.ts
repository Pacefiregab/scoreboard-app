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

/**
 * Resolves the constrained player for a round.
 *
 * `players` must already be the ACTIVE players sorted by `order` — the same set
 * the server validates against. A manual `overrideId` wins, but only when it
 * still points at one of those players (an overridden player can later be
 * deactivated or removed), otherwise we fall back to the automatic rotation.
 */
export function resolveConstrainedPlayerId<T extends { id: string }>(
  players: T[],
  roundNumber: number,
  overrideId?: string | null,
): string | undefined {
  if (players.length === 0) return undefined
  if (overrideId && players.some((p) => p.id === overrideId)) return overrideId
  return players[getConstrainedIndex(roundNumber, players.length)]?.id
}
