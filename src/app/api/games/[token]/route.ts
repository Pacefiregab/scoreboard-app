import { ok, handleError } from '@/lib/api-helpers'
import { getGame, updateDeckCount } from '@/lib/game-service'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const game = await getGame(token)
    return ok(game)
  } catch (e) {
    return handleError(e)
  }
}

/** Game-level settings that stay editable while playing. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await req.json() as { deckCount?: unknown }

    if (body.deckCount === undefined) {
      return Response.json({ error: 'Provide deckCount to update' }, { status: 400 })
    }

    await updateDeckCount(token, Number(body.deckCount))
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
