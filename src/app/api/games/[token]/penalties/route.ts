import { ok, handleError } from '@/lib/api-helpers'
import { addPenalty } from '@/lib/game-service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await req.json() as { playerId?: unknown; count?: unknown; reason?: unknown }

    if (typeof body.playerId !== 'string') {
      return Response.json({ error: 'playerId is required' }, { status: 400 })
    }

    const count = body.count === undefined ? 1 : Number(body.count)
    if (!Number.isInteger(count) || count < 1) {
      return Response.json({ error: 'count must be a positive integer' }, { status: 400 })
    }

    const reason = typeof body.reason === 'string' ? body.reason : undefined

    await addPenalty(token, body.playerId, count, reason)
    return ok({ ok: true }, 201)
  } catch (e) {
    return handleError(e)
  }
}
