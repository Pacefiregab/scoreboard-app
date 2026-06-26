export type Bet = {
  playerId: string
  announced: number
  actual?: number
}

export type ScoredBet = Bet & {
  actual: number
  points: number
}

export function computeRoundScores(bets: (Bet & { actual: number })[]): ScoredBet[] {
  return bets.map((bet) => {
    const points =
      bet.actual === bet.announced
        ? 10 + 10 * bet.actual
        : -10 * Math.abs(bet.actual - bet.announced)

    return { ...bet, points }
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
