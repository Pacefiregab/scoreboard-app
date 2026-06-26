import { ok, handleError } from '@/lib/api-helpers'
import { updateRoundCardCount } from '@/lib/game-service'

type Params = Promise<{ token: string; roundId: string }>

export async function PATCH(req: Request, { params }: { params: Params }) {
  try {
    const { token, roundId } = await params
    const body = await req.json() as { cardCount?: unknown }
    if (typeof body.cardCount !== 'number') {
      return Response.json({ error: 'cardCount must be a number' }, { status: 400 })
    }
    await updateRoundCardCount(token, roundId, body.cardCount)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
