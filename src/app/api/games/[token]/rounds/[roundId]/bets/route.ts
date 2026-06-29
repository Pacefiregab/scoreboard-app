import { ok, handleError } from '@/lib/api-helpers'
import { submitBets, resetBets } from '@/lib/game-service'

type Params = Promise<{ token: string; roundId: string }>

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { token, roundId } = await params
    const body = await req.json() as { bets?: unknown }

    if (
      !Array.isArray(body.bets) ||
      body.bets.some(
        (b) =>
          typeof b !== 'object' ||
          b === null ||
          typeof (b as Record<string, unknown>).playerId !== 'string' ||
          typeof (b as Record<string, unknown>).announced !== 'number',
      )
    ) {
      return Response.json(
        { error: 'bets must be an array of { playerId: string, announced: number }' },
        { status: 400 },
      )
    }

    await submitBets(token, roundId, body.bets as { playerId: string; announced: number }[])
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    const { token, roundId } = await params
    await resetBets(token, roundId)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
