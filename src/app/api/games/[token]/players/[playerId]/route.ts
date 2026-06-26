import { ok, handleError } from '@/lib/api-helpers'
import { updatePlayer } from '@/lib/game-service'

type Params = Promise<{ token: string; playerId: string }>

export async function PATCH(req: Request, { params }: { params: Params }) {
  try {
    const { token, playerId } = await params
    const body = await req.json() as { name?: unknown; order?: unknown; active?: unknown }

    const update: { name?: string; order?: number; active?: boolean } = {}
    if (typeof body.name === 'string' && body.name.trim() !== '') update.name = body.name
    if (typeof body.order === 'number') update.order = body.order
    if (typeof body.active === 'boolean') update.active = body.active

    if (Object.keys(update).length === 0) {
      return Response.json({ error: 'Provide name, order or active to update' }, { status: 400 })
    }

    await updatePlayer(token, playerId, update)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
