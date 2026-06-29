'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  name: string
}

export function WinnerEffect({ name }: Props) {
  useEffect(() => {
    // Burst central
    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'],
    })

    // Canons latéraux décalés
    const t1 = setTimeout(() => {
      confetti({ particleCount: 70, angle: 55, spread: 60, origin: { x: 0, y: 0.65 }, colors: ['#f43f5e', '#facc15', '#4ade80'] })
      confetti({ particleCount: 70, angle: 125, spread: 60, origin: { x: 1, y: 0.65 }, colors: ['#60a5fa', '#a78bfa', '#fb923c'] })
    }, 350)

    // Troisième salve
    const t2 = setTimeout(() => {
      confetti({ particleCount: 60, spread: 90, origin: { y: 0.4 }, scalar: 0.8 })
    }, 800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="text-center pt-8 pb-2 space-y-3">
      <div
        className="text-6xl select-none"
        style={{ animation: 'trophy-bounce 1.4s ease-in-out 0.6s infinite' }}
      >
        🏆
      </div>
      <div style={{ animation: 'winner-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <h1 className="text-3xl font-bold tracking-tight">{name} gagne !</h1>
        <p className="text-muted-foreground text-sm mt-1">Félicitations !</p>
      </div>
    </div>
  )
}
