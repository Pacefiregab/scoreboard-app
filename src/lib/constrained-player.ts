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

/** The player one seat after `afterId` in the rotation. */
export function nextConstrainedPlayerId<T extends { id: string }>(
  players: T[],
  afterId: string | undefined,
): string | undefined {
  if (players.length === 0) return undefined
  const index = players.findIndex((p) => p.id === afterId)
  if (index === -1) return undefined
  return players[(index + 1) % players.length]?.id
}

/**
 * The constraint that will apply to the *upcoming* round (`getNextRoundNumber`).
 *
 * Once a round carries an explicit constraint, the rotation resumes from that
 * seat rather than from the position it would have reached on its own: with
 * a,b,c,d,e,f where b was due and the admin moved it to f, the next round
 * constrains a — not c. Rounds created after that keep an explicit constraint
 * too, so the shift sticks for the rest of the game.
 *
 * Mirrors what `startNextRound` persists; kept here so previews agree with it.
 */
export function getUpcomingConstrainedPlayerId<T extends { id: string }>(
  game: GameState,
  activePlayers: T[],
): string | undefined {
  const lastRound = game.rounds.at(-1)

  // Round still open: its own constraint is the one in play.
  if (lastRound && lastRound.status !== 'DONE') {
    return resolveConstrainedPlayerId(activePlayers, lastRound.number, lastRound.constrainedPlayerId)
  }

  // A new round is about to be created — inherit the shift if there was one.
  if (lastRound?.constrainedPlayerId) {
    const previous = resolveConstrainedPlayerId(
      activePlayers,
      lastRound.number,
      lastRound.constrainedPlayerId,
    )
    const shifted = nextConstrainedPlayerId(activePlayers, previous)
    if (shifted) return shifted
  }

  return resolveConstrainedPlayerId(activePlayers, getNextRoundNumber(game), null)
}
