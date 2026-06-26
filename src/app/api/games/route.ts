import { ok, handleError } from '@/lib/api-helpers'
import { createGame } from '@/lib/game-service'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { players?: unknown }
    const players = body.players

    if (!Array.isArray(players) || players.some((p) => typeof p !== 'string')) {
      return Response.json({ error: 'players must be an array of strings' }, { status: 400 })
    }

    const game = await createGame(players as string[])
    return ok(game, 201)
  } catch (e) {
    return handleError(e)
  }
}
