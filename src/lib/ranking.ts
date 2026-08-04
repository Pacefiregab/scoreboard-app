import type { GameState, PlayerState } from '@/types/game'

/**
 * Standard competition ranking ("1224"): tied entries share the same rank and
 * the following rank skips the seats they occupied.
 *
 *   30 pts → 1
 *   30 pts → 1
 *   10 pts → 3   (not 2)
 *    0 pts → 4
 *
 * `items` must already be sorted. `key` returns the value ties are judged on —
 * entries compare equal when their keys are strictly equal, so build a
 * composite (e.g. a joined string) when several fields decide a tie.
 */
export function competitionRanks<T>(items: T[], key: (item: T) => unknown): number[] {
  const ranks: number[] = []
  let currentRank = 1

  items.forEach((item, index) => {
    if (index > 0 && key(item) !== key(items[index - 1]!)) {
      currentRank = index + 1
    }
    ranks.push(currentRank)
  })

  return ranks
}

/** True when at least one other entry shares this entry's rank. */
export function isTied(ranks: number[], index: number): boolean {
  const rank = ranks[index]
  return ranks.filter((r) => r === rank).length > 1
}

// ─── Game standings ──────────────────────────────────────────────────────────

export interface Standing {
  player: PlayerState
  /** Determined by score alone, so equal scores always share a rank. */
  rank: number
  /** Contracts met over rounds actually played, in this game only. */
  contractRate: number
  contractsWon: number
  roundsPlayed: number
  /** Another player has the same score, so the rate decided the display order. */
  tied: boolean
}

/** Contracts met vs rounds played by a player in this game. */
export function getContractRecord(game: GameState, playerId: string) {
  const bets = game.rounds
    .flatMap((r) => r.bets)
    .filter((b) => b.playerId === playerId && b.actual !== null)
  const won = bets.filter((b) => b.actual === b.announced).length
  return { won, played: bets.length, rate: bets.length > 0 ? won / bets.length : 0 }
}

/**
 * Players ordered by score, then by contract success rate within this game.
 *
 * The rate only orders players *inside* a group of equal scores — it never
 * changes the rank itself, so everyone on the same score shares a rank and the
 * best performer of the group is simply listed first.
 */
export function getStandings(game: GameState): Standing[] {
  const withRecord = game.players.map((player) => ({
    player,
    ...getContractRecord(game, player.id),
  }))

  const sorted = [...withRecord].sort(
    (a, b) => b.player.totalScore - a.player.totalScore || b.rate - a.rate,
  )

  const ranks = competitionRanks(sorted, (s) => s.player.totalScore)

  return sorted.map((s, i) => ({
    player: s.player,
    rank: ranks[i]!,
    contractRate: s.rate,
    contractsWon: s.won,
    roundsPlayed: s.played,
    tied: ranks.filter((r) => r === ranks[i]).length > 1,
  }))
}
