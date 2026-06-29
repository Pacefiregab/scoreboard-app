'use client'

import { useGameContext } from '@/context/GameContext'
import { Scoreboard } from './Scoreboard'
import { BettingPhase } from './BettingPhase'
import { PlayingPhase } from './PlayingPhase'
import { GameControls } from './GameControls'
import { RoundHistory } from './RoundHistory'
import { ScoreChart } from './ScoreChart'

export function GameBoard() {
  const { game, error, loading, refresh } = useGameContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error ?? 'Partie introuvable'}</p>
      </div>
    )
  }

  const currentRound = game.rounds.at(-1)
  const isAdmin = game.isAdmin
  const token = game.adminToken

  async function submitBets(bets: { playerId: string; announced: number }[]) {
    if (!currentRound) return
    const res = await fetch(`/api/games/${token}/rounds/${currentRound.id}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bets }),
    })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      throw new Error(data.error ?? 'Erreur')
    }
    refresh()
  }

  async function submitResults(results: { playerId: string; actual: number }[]) {
    if (!currentRound) return
    const res = await fetch(`/api/games/${token}/rounds/${currentRound.id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      throw new Error(data.error ?? 'Erreur')
    }
    refresh()
  }

  async function resetBets() {
    if (!currentRound) return
    const res = await fetch(`/api/games/${token}/rounds/${currentRound.id}/bets`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      throw new Error(data.error ?? 'Erreur')
    }
    refresh()
  }

  const showControls =
    isAdmin &&
    game.status === 'ACTIVE' &&
    (!currentRound || currentRound.status === 'DONE' || currentRound.status === 'BETTING')

  const activePhase = isAdmin && game.status === 'ACTIVE' && (
    <>
      {currentRound?.status === 'BETTING' && (
        <BettingPhase game={game} round={currentRound} onSubmit={submitBets} />
      )}
      {currentRound?.status === 'PLAYING' && (
        <PlayingPhase game={game} round={currentRound} onSubmit={submitResults} onBack={resetBets} />
      )}
      {showControls && <GameControls game={game} onAction={refresh} />}
    </>
  )

  return (
    <main className="max-w-5xl mx-auto px-4 py-4 pb-8">
      {game.status === 'FINISHED' && (
        <p className="text-xs text-muted-foreground mb-3">Partie terminée</p>
      )}

      {/* Responsive layout: 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4 items-start">
        {/* Left: interactive controls (sticky on desktop) */}
        {activePhase && (
          <div className="space-y-3 lg:sticky lg:top-16">
            {activePhase}
          </div>
        )}

        {/* Right (or below on mobile): scoreboard + history */}
        <div className={`space-y-4 ${activePhase ? '' : 'md:col-span-2'}`}>
          <Scoreboard game={game} />
          <ScoreChart game={game} />
          <RoundHistory game={game} />
        </div>
      </div>
    </main>
  )
}
