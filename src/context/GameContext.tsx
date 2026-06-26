'use client'

import { createContext, useContext } from 'react'
import type { GameState } from '@/types/game'

interface GameContextValue {
  game: GameState | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export const GameContext = createContext<GameContextValue>({
  game: null,
  loading: true,
  error: null,
  refresh: () => {},
})

export const useGameContext = () => useContext(GameContext)
