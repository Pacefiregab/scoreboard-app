import { ok, handleError } from '@/lib/api-helpers'
import { submitResults } from '@/lib/game-service'

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
