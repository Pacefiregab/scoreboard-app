import { describe, it, expect } from 'vitest'
import type { GameState } from '@/types/game'
import { competitionRanks, isTied, getStandings, getContractRecord } from './ranking'

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

// ─── Game standings ──────────────────────────────────────────────────────────

/**
 * Builds a game where each player's `bets` entry is [announced, actual] per
 * round, so a contract is met when the pair matches.
 */
function makeGame(
  players: { id: string; score: number; bets: [number, number][] }[],
): GameState {
  const roundCount = Math.max(0, ...players.map((p) => p.bets.length))
  return {
    id: 'g', adminToken: 't', viewToken: 'v', status: 'FINISHED', phase: 'ASCENDING', isAdmin: true,
    players: players.map((p, i) => ({
      id: p.id, name: p.id, order: i, active: true, initialScore: 0, totalScore: p.score,
    })),
    rounds: Array.from({ length: roundCount }, (_, r) => ({
      id: `r${r}`, number: r + 1, cardCount: 1, status: 'DONE' as const, constrainedPlayerId: null,
      bets: players
        .filter((p) => p.bets[r])
        .map((p) => ({ playerId: p.id, announced: p.bets[r]![0], actual: p.bets[r]![1] })),
      scores: [],
    })),
  }
}

describe('getContractRecord', () => {
  it('counts met contracts over rounds played', () => {
    const game = makeGame([{ id: 'A', score: 0, bets: [[1, 1], [2, 0], [0, 0]] }])
    expect(getContractRecord(game, 'A')).toEqual({ won: 2, played: 3, rate: 2 / 3 })
  })

  it('reports a zero rate for a player with no completed rounds', () => {
    expect(getContractRecord(makeGame([{ id: 'A', score: 0, bets: [] }]), 'A'))
      .toEqual({ won: 0, played: 0, rate: 0 })
  })
})

describe('getStandings', () => {
  it('separates equal scores by contract rate', () => {
    // Both finish on 30, but B met 2/2 contracts and A only 1/2.
    const game = makeGame([
      { id: 'A', score: 30, bets: [[1, 1], [1, 0]] },
      { id: 'B', score: 30, bets: [[1, 1], [1, 1]] },
    ])
    const s = getStandings(game)
    expect(s.map((x) => x.player.id)).toEqual(['B', 'A'])
    expect(s.map((x) => x.rank)).toEqual([1, 2])
    expect(s.every((x) => x.scoreTied)).toBe(true)
    expect(s.some((x) => x.rankShared)).toBe(false)
  })

  it('shares the rank when score and contract rate both match', () => {
    const game = makeGame([
      { id: 'A', score: 30, bets: [[1, 1]] },
      { id: 'B', score: 30, bets: [[2, 2]] },
      { id: 'C', score: 10, bets: [[1, 0]] },
    ])
    const s = getStandings(game)
    expect(s.map((x) => x.rank)).toEqual([1, 1, 3])
    expect(s.slice(0, 2).every((x) => x.rankShared)).toBe(true)
  })

  it('leaves distinct scores alone regardless of contract rate', () => {
    // A scores more despite a worse rate — score still wins.
    const game = makeGame([
      { id: 'A', score: 50, bets: [[1, 0]] },
      { id: 'B', score: 20, bets: [[1, 1]] },
    ])
    const s = getStandings(game)
    expect(s.map((x) => x.player.id)).toEqual(['A', 'B'])
    expect(s.every((x) => x.scoreTied)).toBe(false)
  })

  it('reproduces the spec example, tie broken by rate', () => {
    const game = makeGame([
      { id: 'A', score: 30, bets: [[1, 1], [1, 1]] },
      { id: 'B', score: 30, bets: [[1, 1], [1, 0]] },
      { id: 'C', score: 10, bets: [[1, 0], [1, 0]] },
      { id: 'D', score: 0,  bets: [[1, 0], [1, 0]] },
    ])
    const s = getStandings(game)
    expect(s.map((x) => `${x.rank}. ${x.player.id}`)).toEqual(['1. A', '2. B', '3. C', '4. D'])
  })

  it('handles a game with no rounds played yet', () => {
    const game = makeGame([{ id: 'A', score: 0, bets: [] }, { id: 'B', score: 0, bets: [] }])
    expect(getStandings(game).map((x) => x.rank)).toEqual([1, 1])
  })
})
