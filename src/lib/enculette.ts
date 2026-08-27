export type Bet = {
  playerId: string
  announced: number
  actual?: number
  /** Doubles this round's points — the loss as well as the gain. */
  bonusX2?: boolean
}

export type ScoredBet = Bet & {
  actual: number
  points: number
}

export function computeRoundScores(bets: (Bet & { actual: number })[]): ScoredBet[] {
  return bets.map((bet) => {
    const base =
      bet.actual === bet.announced
        ? 10 + 10 * bet.actual
        : -10 * Math.abs(bet.actual - bet.announced)

    // Deliberately applied to negative rounds too: arming the bonus is a bet.
    return { ...bet, points: bet.bonusX2 ? base * 2 : base }
  })
}

export function isLastBetValid(params: {
  cardCount: number
  previousBets: number[]
  candidateBet: number
}): boolean {
  const { cardCount, previousBets, candidateBet } = params
  const sum = previousBets.reduce((acc, b) => acc + b, 0) + candidateBet
  return sum !== cardCount
}

export function nextCardCount(params: {
  current: number
  phase: 'ASCENDING' | 'DESCENDING'
}): number {
  const { current, phase } = params
  return phase === 'ASCENDING' ? current + 1 : current - 1
}

export function isGameOver(params: {
  cardCount: number
  phase: 'ASCENDING' | 'DESCENDING'
}): boolean {
  return params.phase === 'DESCENDING' && params.cardCount === 0
}

export const CARDS_PER_DECK = 52

/**
 * Most cards that can be dealt to each player in a round, given the decks in
 * play and how many players share them.
 *
 * Informative only — nothing stops the admin from dealing past it, so this is
 * never enforced server-side.
 */
export function maxCardCount(params: { deckCount: number; playerCount: number }): number {
  const { deckCount, playerCount } = params
  if (playerCount < 1) return 0
  return Math.floor((CARDS_PER_DECK * deckCount) / playerCount)
}
