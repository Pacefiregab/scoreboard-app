import { ok, handleError } from '@/lib/api-helpers'
import { createGame, listActiveGames } from '@/lib/game-service'

export async function GET() {
  try {
    const games = await listActiveGames()
    return ok(games)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { players?: unknown; rules?: unknown }
    const players = body.players

    if (!Array.isArray(players) || players.some((p) => typeof p !== 'string')) {
      return Response.json({ error: 'players must be an array of strings' }, { status: 400 })
    }

    const raw = (body.rules ?? {}) as {
      bonusX2?: unknown
      penalties?: unknown
      penaltyPoints?: unknown
    }

    // Stored positive; the deduction happens when a penalty is applied.
    let penaltyPoints: number | undefined
    if (raw.penaltyPoints !== undefined) {
      const n = Number(raw.penaltyPoints)
      if (!Number.isInteger(n) || n < 1) {
        return Response.json(
          { error: 'penaltyPoints must be a positive integer' },
          { status: 400 },
        )
      }
      penaltyPoints = n
    }

    const rules = {
      bonusX2: raw.bonusX2 === true,
      penalties: raw.penalties === true,
      ...(penaltyPoints !== undefined ? { penaltyPoints } : {}),
    }

    const game = await createGame(players as string[], rules)
    return ok(game, 201)
  } catch (e) {
    return handleError(e)
  }
}
