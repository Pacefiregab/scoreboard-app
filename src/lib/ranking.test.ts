import { describe, it, expect } from 'vitest'
import { competitionRanks, isTied } from './ranking'

const score = (s: { pts: number }) => s.pts

describe('competitionRanks', () => {
  it('gives tied entries the same rank and skips the next one', () => {
    // The example from the spec: A 30, B 30, C 10, D 0 → 1, 1, 3, 4
    const items = [{ pts: 30 }, { pts: 30 }, { pts: 10 }, { pts: 0 }]
    expect(competitionRanks(items, score)).toEqual([1, 1, 3, 4])
  })

  it('numbers distinct scores consecutively', () => {
    expect(competitionRanks([{ pts: 3 }, { pts: 2 }, { pts: 1 }], score)).toEqual([1, 2, 3])
  })

  it('handles a tie that is not at the top', () => {
    expect(competitionRanks([{ pts: 9 }, { pts: 5 }, { pts: 5 }, { pts: 1 }], score)).toEqual([1, 2, 2, 4])
  })

  it('handles a tie at the bottom', () => {
    expect(competitionRanks([{ pts: 9 }, { pts: 1 }, { pts: 1 }], score)).toEqual([1, 2, 2])
  })

  it('gives everyone rank 1 when all are equal', () => {
    expect(competitionRanks([{ pts: 5 }, { pts: 5 }, { pts: 5 }], score)).toEqual([1, 1, 1])
  })

  it('handles three-way ties followed by more players', () => {
    const items = [{ pts: 7 }, { pts: 7 }, { pts: 7 }, { pts: 4 }, { pts: 4 }, { pts: 0 }]
    expect(competitionRanks(items, score)).toEqual([1, 1, 1, 4, 4, 6])
  })

  it('treats negative scores like any other value', () => {
    expect(competitionRanks([{ pts: 0 }, { pts: -10 }, { pts: -10 }], score)).toEqual([1, 2, 2])
  })

  it('returns an empty array for no items', () => {
    expect(competitionRanks([], score)).toEqual([])
  })

  it('supports composite keys for multi-field ties', () => {
    const items = [
      { wins: 2, avg: 10 },
      { wins: 2, avg: 10 },
      { wins: 2, avg: 5 },
    ]
    const composite = (s: { wins: number; avg: number }) => `${s.wins}|${s.avg}`
    expect(competitionRanks(items, composite)).toEqual([1, 1, 3])
  })
})

describe('isTied', () => {
  it('flags entries sharing a rank', () => {
    const ranks = [1, 1, 3, 4]
    expect(isTied(ranks, 0)).toBe(true)
    expect(isTied(ranks, 1)).toBe(true)
    expect(isTied(ranks, 2)).toBe(false)
    expect(isTied(ranks, 3)).toBe(false)
  })
})
