export type GameStatus = 'ACTIVE' | 'FINISHED'
export type GamePhase = 'ASCENDING' | 'DESCENDING'
export type RoundStatus = 'BETTING' | 'PLAYING' | 'DONE'

export interface PlayerState {
  id: string
  name: string
  order: number
  active: boolean
  initialScore: number
  /** Round scores minus penalties — the number shown in the standings. */
  totalScore: number
  /** Points lost to penalties, positive. */
  penaltyPoints: number
}

export interface PenaltyState {
  id: string
  playerId: string
  /** Points deducted, positive. */
  points: number
  reason: string | null
  createdAt: string
}

export interface BetState {
  playerId: string
  announced: number
  actual: number | null
  /** Armed at bet time; doubles this round's points. Once per player per game. */
  bonusX2: boolean
}

export interface RoundScoreState {
  playerId: string
  points: number
  totalPoints: number
}

export interface RoundState {
  id: string
  number: number
  cardCount: number
  status: RoundStatus
  /** Manual override of the constrained player; null = automatic rotation */
  constrainedPlayerId: string | null
  bets: BetState[]
  scores: RoundScoreState[]
}

/** Optional rules picked when the game is created. */
export interface GameRules {
  /** Each player may double one round's score, armed by the admin at bet time. */
  bonusX2: boolean
  /** The admin may deduct arbitrary points (misdeal, wrong card…). */
  penalties: boolean
  /** Points removed per penalty, stored positive. Only meaningful with `penalties`. */
  penaltyPoints: number
  /** Decks in play (1 or 2); with the player count it caps the cards per round. */
  deckCount: number
}

export interface GameState {
  id: string
  adminToken: string
  viewToken: string
  status: GameStatus
  phase: GamePhase
  isAdmin: boolean
  rules: GameRules
  players: PlayerState[]
  rounds: RoundState[]
  penalties: PenaltyState[]
}
