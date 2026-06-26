import { ok, handleError } from '@/lib/api-helpers'
import { addPlayer } from '@/lib/game-service'

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

    await addPlayer(token, body.name, initialScore, order)
    return ok({ ok: true }, 201)
  } catch (e) {
    return handleError(e)
  }
}
