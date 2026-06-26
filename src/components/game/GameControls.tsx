'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameState } from '@/types/game'
import { nextCardCount, isGameOver } from '@/lib/enculette'
import { Button } from '@/components/ui/button'

interface Props {
  game: GameState
  onAction: () => void
}

export function GameControls({ game, onAction }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'next' | 'finish' | null>(null)

  const lastRound = game.rounds.at(-1)
  const lastRoundDone = !lastRound || lastRound.status === 'DONE'
  const hasScores = game.rounds.some((r) => r.status === 'DONE')

  const nextCards = lastRound
    ? nextCardCount({ current: lastRound.cardCount, phase: game.phase })
    : 1
  const wouldEnd = isGameOver({ cardCount: nextCards, phase: game.phase })

  const isFirstStart = !lastRound

  async function handleNextRound() {
    setLoading('next')
    try {
      await fetch(`/api/games/${game.adminToken}/rounds`, { method: 'POST' })
      onAction()
    } finally {
      setLoading(null)
    }
  }

  async function handleFinish() {
    setLoading('finish')
    try {
      await fetch(`/api/games/${game.adminToken}/finish`, { method: 'POST' })
      router.push(`/game/${game.adminToken}/summary`)
    } finally {
      setLoading(null)
    }
  }

  if (!lastRoundDone || wouldEnd) return null

  return (
    <div className="space-y-2">
      <Button onClick={handleNextRound} disabled={loading !== null} className="w-full">
        {loading === 'next'
          ? 'Chargement...'
          : isFirstStart
            ? 'Commencer la partie'
            : `Manche suivante (${nextCards} carte${nextCards > 1 ? 's' : ''})`}
      </Button>

      {hasScores && (
        <Button
          variant="outline"
          onClick={handleFinish}
          disabled={loading !== null}
          className="w-full text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30"
        >
          {loading === 'finish' ? 'Finalisation...' : 'Terminer la partie'}
        </Button>
      )}
    </div>
  )
}
