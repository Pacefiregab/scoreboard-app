import { ok, handleError, ApiError } from '@/lib/api-helpers'
import { addPlayer, reorderPlayers } from '@/lib/game-service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await req.json() as { name?: unknown; initialScore?: unknown; order?: unknown }

    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const initialScore = typeof body.initialScore === 'number' ? body.initialScore : 0
    const order = typeof body.order === 'number' ? body.order : 9999

    const created = await addPlayer(token, body.name, initialScore, order)
    return ok({ ok: true, id: created.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}

/** Bulk reorder — assigns every player's position and active flag atomically. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await req.json() as { players?: unknown }

    if (!Array.isArray(body.players)) {
      return Response.json({ error: 'players must be an array' }, { status: 400 })
    }

    const entries = body.players.map((raw) => {
      const p = raw as { id?: unknown; order?: unknown; active?: unknown }
      if (typeof p.id !== 'string' || typeof p.order !== 'number' || typeof p.active !== 'boolean') {
        throw new ApiError('Each player needs id, order and active', 400)
      }
      return { id: p.id, order: p.order, active: p.active }
    })

    await reorderPlayers(token, entries)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
