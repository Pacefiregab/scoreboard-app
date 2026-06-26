export type GameStatus = 'ACTIVE' | 'FINISHED'
export type GamePhase = 'ASCENDING' | 'DESCENDING'
export type RoundStatus = 'BETTING' | 'PLAYING' | 'DONE'

export interface PlayerState {
  id: string
  name: string
  order: number
  active: boolean
  initialScore: number
  totalScore: number
}

export interface BetState {
  playerId: string
  announced: number
  actual: number | null
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
  bets: BetState[]
  scores: RoundScoreState[]
}

export interface GameState {
  id: string
  adminToken: string
  viewToken: string
  status: GameStatus
  phase: GamePhase
  isAdmin: boolean
  players: PlayerState[]
  rounds: RoundState[]
}
