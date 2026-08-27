'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameState } from '@/types/game'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ManagePlayersDialog } from './ManagePlayersDialog'
import { PenaltiesDialog } from './PenaltiesDialog'
import { QRCodeSVG } from 'qrcode.react'
import {
  Menu,
  ChevronsDown,
  ChevronsUp,
  Flag,
  Users,
  Hash,
  X,
  Share2,
  Check,
  MinusCircle,
} from 'lucide-react'

interface Props {
  game: GameState
  onAction: () => void
}

export function GameMenu({ game, onAction }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [managePlayersOpen, setManagePlayersOpen] = useState(false)
  const [penaltiesOpen, setPenaltiesOpen] = useState(false)
  const [cardCountValue, setCardCountValue] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const lastRound = game.rounds.at(-1)
  const inBetting = lastRound?.status === 'BETTING'
  const inPlaying = lastRound?.status === 'PLAYING'
  const hasScores = game.rounds.some((r) => r.status === 'DONE')

  // Both directions, and still available while the round is only taking bets —
  // validating them starts the round and locks its card count.
  const targetPhase = game.phase === 'ASCENDING' ? 'DESCENDING' : 'ASCENDING'
  const canSwitchPhase = Boolean(lastRound) && !inPlaying

  async function post(path: string, label: string, body?: object) {
    setLoading(label)
    try {
      await fetch(`/api/games/${game.adminToken}/${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      onAction()
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  async function handleChangeCardCount() {
    const n = parseInt(cardCountValue, 10)
    if (!lastRound || isNaN(n) || n < 1) return
    setLoading('cardCount')
    try {
      await fetch(`/api/games/${game.adminToken}/rounds/${lastRound.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardCount: n }),
      })
      onAction()
      setCardCountValue('')
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel() {
    setLoading('cancel')
    try {
      await fetch(`/api/games/${game.adminToken}/cancel`, { method: 'POST' })
      router.push('/')
    } finally {
      setLoading(null)
    }
  }

  async function handleFinish() {
    await post('finish', 'finish')
    router.push(`/game/${game.adminToken}/summary`)
  }

  function closeAndOpen(action: () => void) {
    setOpen(false)
    setTimeout(action, 150)
  }

  const viewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/view/${game.viewToken}`
    : ''

  async function handleShare() {
    if (!shareOpen) { setShareOpen(true); return }
    if (navigator.share) {
      await navigator.share({ title: 'Scoreboard', url: viewUrl })
    } else {
      await navigator.clipboard.writeText(viewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
          <Menu size={18} />
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">Options</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-1 pb-6">
            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} className="text-muted-foreground" />}
              {copied ? 'Lien copié !' : 'Partager la partie'}
            </button>
            {shareOpen && (
              <div className="flex flex-col items-center gap-3 px-1 py-2">
                <QRCodeSVG value={viewUrl} size={180} />
                <p className="text-xs text-muted-foreground break-all text-center">{viewUrl}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    await navigator.clipboard.writeText(viewUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? 'Copié !' : 'Copier le lien'}
                </Button>
              </div>
            )}

            <Separator className="my-1" />

            {/* Change card count — only during betting */}
            {inBetting && (
              <div className="flex items-center gap-2 px-1 py-2">
                <Hash size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm flex-1">Nombre de cartes</span>
                <Input
                  type="number"
                  min={1}
                  placeholder={String(lastRound?.cardCount ?? '')}
                  value={cardCountValue}
                  onChange={(e) => setCardCountValue(e.target.value)}
                  className="w-20 text-center h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleChangeCardCount}
                  disabled={!cardCountValue || loading === 'cardCount'}
                  className="h-8"
                >
                  OK
                </Button>
              </div>
            )}

            {/* Players: order, add, activate, constraint */}
            <button
              onClick={() => closeAndOpen(() => setManagePlayersOpen(true))}
              className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
            >
              <Users size={16} className="text-muted-foreground" />
              Gérer les joueurs
            </button>

            {/* Penalties — only when the rule is on */}
            {game.rules.penalties && (
              <button
                onClick={() => closeAndOpen(() => setPenaltiesOpen(true))}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
              >
                <MinusCircle size={16} className="text-muted-foreground" />
                Pénalités
                <span className="ml-auto text-xs text-muted-foreground">
                  −{game.rules.penaltyPoints} pts
                </span>
              </button>
            )}

            {/* Turn the pyramid around, either way */}
            {canSwitchPhase && (
              <button
                onClick={() => post('phase', 'phase', { phase: targetPhase })}
                disabled={loading === 'phase'}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors"
              >
                {targetPhase === 'DESCENDING'
                  ? <ChevronsDown size={16} className="text-muted-foreground" />
                  : <ChevronsUp size={16} className="text-muted-foreground" />}
                {targetPhase === 'DESCENDING' ? 'Commencer la descente' : 'Repasser en montée'}
                {inBetting && (
                  <span className="ml-auto text-xs text-muted-foreground">manche en cours</span>
                )}
              </button>
            )}

            <Separator className="my-1" />

            {/* Finish — only when there are scores */}
            {hasScores && !inPlaying && (
              <button
                onClick={handleFinish}
                disabled={loading === 'finish'}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors text-orange-600 dark:text-orange-400"
              >
                <Flag size={16} />
                Terminer la partie
              </button>
            )}

            {/* Cancel */}
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                className="flex items-center gap-3 px-1 py-3 text-sm hover:bg-muted rounded-lg transition-colors text-destructive"
              >
                <X size={16} />
                {hasScores ? 'Annuler la partie' : 'Annuler la partie'}
              </button>
            ) : (
              <div className="rounded-lg border border-destructive/50 p-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {hasScores
                    ? '⚠️ Supprimer définitivement cette partie et tout son historique ?'
                    : 'Annuler et supprimer cette partie ?'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={loading === 'cancel'}
                    className="flex-1"
                  >
                    {loading === 'cancel' ? 'Suppression...' : 'Confirmer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelConfirm(false)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ManagePlayersDialog
        game={game}
        open={managePlayersOpen}
        onClose={() => setManagePlayersOpen(false)}
        onDone={onAction}
      />

      <PenaltiesDialog
        game={game}
        open={penaltiesOpen}
        onClose={() => setPenaltiesOpen(false)}
        onDone={onAction}
      />
    </>
  )
}
