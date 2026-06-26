'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { GameState } from '@/types/game'

export function useGame(token: string) {
  const [game, setGame] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const gameRef = useRef<GameState | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${token}`)
      if (res.status === 404) { setError('Partie introuvable'); return }
      if (!res.ok) { setError('Erreur lors du chargement'); return }
      const data: GameState = await res.json()
      setGame(data)
      gameRef.current = data
      setError(null)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      if (gameRef.current?.status !== 'FINISHED') refresh()
    }, 4000)
    return () => clearInterval(interval)
  }, [refresh])

  return { game, error, loading, refresh }
}
