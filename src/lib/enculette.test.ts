import { describe, it, expect } from 'vitest'
import {
  computeRoundScores,
  isLastBetValid,
  nextCardCount,
  isGameOver,
  maxCardCount,
} from './enculette'

describe('computeRoundScores', () => {
  it('awards 10 + 10×plis when contract met', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 2, actual: 2 },
    ])
    expect(result[0].points).toBe(30) // 10 + 10*2
  })

  it('awards 10 when contract is 0 and met', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 0, actual: 0 },
    ])
    expect(result[0].points).toBe(10) // 10 + 10*0
  })

  it('penalizes -10×|écart| when contract not met', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 3, actual: 1 },
    ])
    expect(result[0].points).toBe(-20) // -10 * |3-1|
  })

  it('handles multiple players independently', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 1, actual: 1 },
      { playerId: 'p2', announced: 2, actual: 0 },
    ])
    expect(result[0].points).toBe(20)
    expect(result[1].points).toBe(-20)
  })

  it('doubles a winning round when the ×2 bonus is armed', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 2, actual: 2, bonusX2: true },
    ])
    expect(result[0].points).toBe(60) // (10 + 10*2) * 2
  })

  it('doubles a losing round too — arming the bonus is a gamble', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 3, actual: 1, bonusX2: true },
    ])
    expect(result[0].points).toBe(-40) // (-10 * 2) * 2
  })

  it('doubles a met zero contract', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 0, actual: 0, bonusX2: true },
    ])
    expect(result[0].points).toBe(20) // 10 * 2
  })

  it('leaves other players untouched', () => {
    const result = computeRoundScores([
      { playerId: 'p1', announced: 1, actual: 1, bonusX2: true },
      { playerId: 'p2', announced: 1, actual: 1 },
    ])
    expect(result[0].points).toBe(40)
    expect(result[1].points).toBe(20)
  })

  it('treats an absent flag like false', () => {
    const withFlag = computeRoundScores([{ playerId: 'p1', announced: 1, actual: 1, bonusX2: false }])
    const without = computeRoundScores([{ playerId: 'p1', announced: 1, actual: 1 }])
    expect(withFlag[0].points).toBe(without[0].points)
  })
})

describe('isLastBetValid', () => {
  it('rejects a bet that makes the sum equal to cardCount', () => {
    expect(
      isLastBetValid({ cardCount: 4, previousBets: [0, 0, 0], candidateBet: 4 })
    ).toBe(false)
  })

  it('accepts a bet that does not equal cardCount', () => {
    expect(
      isLastBetValid({ cardCount: 4, previousBets: [0, 0, 0], candidateBet: 3 })
    ).toBe(true)
  })

  it('accepts 0 when sum would not equal cardCount', () => {
    expect(
      isLastBetValid({ cardCount: 4, previousBets: [1, 2, 0], candidateBet: 0 })
    ).toBe(true)
  })

  it('rejects when partial sum already equals cardCount with 0', () => {
    expect(
      isLastBetValid({ cardCount: 3, previousBets: [1, 2], candidateBet: 0 })
    ).toBe(false)
  })
})

describe('nextCardCount', () => {
  it('increments in ascending phase', () => {
    expect(nextCardCount({ current: 3, phase: 'ASCENDING' })).toBe(4)
  })

  it('decrements in descending phase', () => {
    expect(nextCardCount({ current: 3, phase: 'DESCENDING' })).toBe(2)
  })
})

describe('maxCardCount', () => {
  it('splits one deck between the players', () => {
    expect(maxCardCount({ deckCount: 1, playerCount: 4 })).toBe(13) // 52 / 4
  })

  it('doubles the peak with two decks', () => {
    expect(maxCardCount({ deckCount: 2, playerCount: 4 })).toBe(26) // 104 / 4
  })

  it('rounds down when the deck does not divide evenly', () => {
    expect(maxCardCount({ deckCount: 1, playerCount: 6 })).toBe(8) // 52 / 6 = 8.67
    expect(maxCardCount({ deckCount: 2, playerCount: 6 })).toBe(17) // 104 / 6 = 17.33
  })

  it('shrinks as players join', () => {
    expect(maxCardCount({ deckCount: 1, playerCount: 2 })).toBe(26)
    expect(maxCardCount({ deckCount: 1, playerCount: 8 })).toBe(6)
  })

  it('returns 0 without players rather than dividing by zero', () => {
    expect(maxCardCount({ deckCount: 1, playerCount: 0 })).toBe(0)
  })
})

describe('isGameOver', () => {
  it('returns true when descending and cardCount reaches 0', () => {
    expect(isGameOver({ cardCount: 0, phase: 'DESCENDING' })).toBe(true)
  })

  it('returns false when still ascending', () => {
    expect(isGameOver({ cardCount: 1, phase: 'ASCENDING' })).toBe(false)
  })

  it('returns false when descending but not at 0', () => {
    expect(isGameOver({ cardCount: 1, phase: 'DESCENDING' })).toBe(false)
  })
})
