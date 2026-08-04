import { describe, it, expect } from 'vitest'
import type { GameState, RoundState } from '@/types/game'
import {
  resolveConstrainedPlayerId,
  nextConstrainedPlayerId,
  getUpcomingConstrainedPlayerId,
} from './constrained-player'

const PLAYERS = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id }))

function round(number: number, status: RoundState['status'], constrainedPlayerId: string | null = null) {
  return { id: `r${number}`, number, cardCount: 1, status, constrainedPlayerId, bets: [], scores: [] }
}

function game(rounds: ReturnType<typeof round>[]): GameState {
  return {
    id: 'g', adminToken: 't', viewToken: 'v', status: 'ACTIVE', phase: 'ASCENDING',
    isAdmin: true, rules: { bonusX2: false, penalties: false, penaltyPoints: 10 },
    players: [], rounds: rounds as RoundState[],
  }
}

describe('resolveConstrainedPlayerId', () => {
  it('rotates one seat per round, starting from the last player', () => {
    expect(resolveConstrainedPlayerId(PLAYERS, 1)).toBe('f')
    expect(resolveConstrainedPlayerId(PLAYERS, 2)).toBe('a')
    expect(resolveConstrainedPlayerId(PLAYERS, 3)).toBe('b')
  })

  it('honours an override that points at a listed player', () => {
    expect(resolveConstrainedPlayerId(PLAYERS, 3, 'f')).toBe('f')
  })

  it('falls back to the rotation when the override is no longer active', () => {
    expect(resolveConstrainedPlayerId(PLAYERS, 3, 'gone')).toBe('b')
  })

  it('returns undefined without players', () => {
    expect(resolveConstrainedPlayerId([], 3)).toBeUndefined()
  })
})

describe('nextConstrainedPlayerId', () => {
  it('advances one seat', () => {
    expect(nextConstrainedPlayerId(PLAYERS, 'b')).toBe('c')
  })

  it('wraps around the end', () => {
    expect(nextConstrainedPlayerId(PLAYERS, 'f')).toBe('a')
  })

  it('returns undefined for an unknown player', () => {
    expect(nextConstrainedPlayerId(PLAYERS, 'gone')).toBeUndefined()
  })
})

describe('getUpcomingConstrainedPlayerId', () => {
  it('uses the plain rotation before any round exists', () => {
    expect(getUpcomingConstrainedPlayerId(game([]), PLAYERS)).toBe('f')
  })

  it('keeps the open round own constraint', () => {
    const g = game([round(3, 'BETTING')])
    expect(getUpcomingConstrainedPlayerId(g, PLAYERS)).toBe('b')
  })

  it('resumes from the forced seat, not the seat it would have reached', () => {
    // Round 3 was due to constrain b; the admin moved it to f.
    // Round 4 must constrain a — not c.
    const g = game([round(3, 'DONE', 'f')])
    expect(getUpcomingConstrainedPlayerId(g, PLAYERS)).toBe('a')
  })

  it('keeps shifting on later rounds', () => {
    // Round 4 inherited 'a' from the move above; round 5 goes to b.
    const g = game([round(3, 'DONE', 'f'), round(4, 'DONE', 'a')])
    expect(getUpcomingConstrainedPlayerId(g, PLAYERS)).toBe('b')
  })

  it('returns to the plain rotation once the override is cleared', () => {
    const g = game([round(3, 'DONE', null)])
    expect(getUpcomingConstrainedPlayerId(g, PLAYERS)).toBe('c')
  })

  it('ignores a forced player who is no longer active', () => {
    // 'f' was forced on round 3 but has since been deactivated: the rotation
    // resumes from where round 3 actually landed (b) → c.
    const stillActive = PLAYERS.filter((p) => p.id !== 'f')
    const g = game([round(3, 'DONE', 'f')])
    expect(getUpcomingConstrainedPlayerId(g, stillActive)).toBe('c')
  })
})
