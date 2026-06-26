import { describe, it, expect } from 'vitest'
import {
  computeRoundScores,
  isLastBetValid,
  nextCardCount,
  isGameOver,
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
