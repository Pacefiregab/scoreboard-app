'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameState } from '@/types/game'
import { nextCardCount, isGameOver, maxCardCount } from '@/lib/enculette'
import { Button } from '@/components/ui/button'
import { ChevronsDown, ChevronsUp } from 'lucide-react'

interface Props {
  game: GameState
  onAction: () => void
}

export function GameControls({ game, onAction }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'next' | 'finish' | 'phase' | null>(null)

  const lastRound = game.rounds.at(-1)
  const lastRoundDone = !lastRound || lastRound.status === 'DONE'
  const hasScores = game.rounds.some((r) => r.status === 'DONE')

  const nextCards = lastRound
    ? nextCardCount({ current: lastRound.cardCount, phase: game.phase })
    : 1
  const wouldEnd = isGameOver({ cardCount: nextCards, phase: game.phase })

  const isFirstStart = !lastRound

  // Turning around only makes sense once a round has been played, and the
  // descent must leave at least one card to deal.
  const targetPhase = game.phase === 'ASCENDING' ? 'DESCENDING' : 'ASCENDING'
  const cardsAfterSwitch = lastRound
    ? nextCardCount({ current: lastRound.cardCount, phase: targetPhase })
    : 0
  const canSwitchPhase = Boolean(lastRound) && cardsAfterSwitch >= 1

  // Past this the deck runs out, so the descent becomes the primary button.
  // Only an emphasis swap: climbing further stays available and allowed.
  const peak = maxCardCount({
    deckCount: game.rules.deckCount,
    playerCount: game.players.filter((p) => p.active).length,
  })
  const atPeak = game.phase === 'ASCENDING' && peak > 0 && nextCards > peak

  async function handleNextRound() {
    setLoading('next')
    try {
      await fetch(`/api/games/${game.adminToken}/rounds`, { method: 'POST' })
      onAction()
    } finally {
      setLoading(null)
    }
  }

  async function handleSwitchPhase() {
    setLoading('phase')
    try {
      await fetch(`/api/games/${game.adminToken}/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: targetPhase }),
      })
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

  if (!lastRoundDone) return null

  return (
    <div className="space-y-2">
      {/* Hidden once the descent is over — the game can only end or turn around */}
      {!wouldEnd && (
        <Button
          onClick={handleNextRound}
          disabled={loading !== null}
          variant={atPeak ? 'outline' : 'default'}
          className="w-full"
        >
          {loading === 'next'
            ? 'Chargement...'
            : isFirstStart
              ? 'Commencer la partie'
              : `Manche suivante (${nextCards} carte${nextCards > 1 ? 's' : ''})`}
        </Button>
      )}

      {canSwitchPhase && (
        <Button
          variant={atPeak || wouldEnd ? 'default' : 'outline'}
          onClick={handleSwitchPhase}
          disabled={loading !== null}
          className="w-full gap-2"
        >
          {targetPhase === 'DESCENDING' ? <ChevronsDown size={15} /> : <ChevronsUp size={15} />}
          {loading === 'phase'
            ? 'Changement...'
            : targetPhase === 'DESCENDING'
              ? `Commencer la descente (${cardsAfterSwitch} carte${cardsAfterSwitch > 1 ? 's' : ''})`
              : `Repasser en montée (${cardsAfterSwitch} carte${cardsAfterSwitch > 1 ? 's' : ''})`}
        </Button>
      )}

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
