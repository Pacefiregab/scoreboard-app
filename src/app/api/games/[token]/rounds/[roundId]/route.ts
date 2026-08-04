import { ok, handleError } from '@/lib/api-helpers'
import { updateRoundCardCount, updateRoundConstrainedPlayer } from '@/lib/game-service'

type Params = Promise<{ token: string; roundId: string }>

export async function PATCH(req: Request, { params }: { params: Params }) {
  try {
    const { token, roundId } = await params
    const body = await req.json() as { cardCount?: unknown; constrainedPlayerId?: unknown }

    if ('constrainedPlayerId' in body) {
      const value = body.constrainedPlayerId
      if (value !== null && typeof value !== 'string') {
        return Response.json({ error: 'constrainedPlayerId must be a string or null' }, { status: 400 })
      }
      await updateRoundConstrainedPlayer(token, roundId, value)
      return ok({ ok: true })
    }

    if (typeof body.cardCount !== 'number') {
      return Response.json({ error: 'cardCount must be a number' }, { status: 400 })
    }
    await updateRoundCardCount(token, roundId, body.cardCount)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
