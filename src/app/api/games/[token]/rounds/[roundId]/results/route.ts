import { ok, handleError, ApiError } from '@/lib/api-helpers'
import { submitResults, amendRound } from '@/lib/game-service'

type Params = Promise<{ token: string; roundId: string }>

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { token, roundId } = await params
    const body = await req.json() as { results?: unknown }

    if (
      !Array.isArray(body.results) ||
      body.results.some(
        (r) =>
          typeof r !== 'object' ||
          r === null ||
          typeof (r as Record<string, unknown>).playerId !== 'string' ||
          typeof (r as Record<string, unknown>).actual !== 'number',
      )
    ) {
      return Response.json(
        { error: 'results must be an array of { playerId: string, actual: number }' },
        { status: 400 },
      )
    }

    await submitResults(token, roundId, body.results as { playerId: string; actual: number }[])
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** Corrige une manche déjà terminée : paris, plis et bonus ×2. */
export async function PATCH(req: Request, { params }: { params: Params }) {
  try {
    const { token, roundId } = await params
    const body = await req.json() as { entries?: unknown }

    if (!Array.isArray(body.entries)) {
      return Response.json({ error: 'entries must be an array' }, { status: 400 })
    }

    const entries = body.entries.map((raw) => {
      const e = raw as Record<string, unknown>
      if (
        typeof e.playerId !== 'string' ||
        !Number.isInteger(e.announced) ||
        !Number.isInteger(e.actual)
      ) {
        throw new ApiError(
          'Chaque entrée attend playerId, announced et actual entiers',
          400,
        )
      }
      return {
        playerId: e.playerId,
        announced: e.announced as number,
        actual: e.actual as number,
        bonusX2: e.bonusX2 === true,
      }
    })

    await amendRound(token, roundId, entries)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
