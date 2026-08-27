import { ok, handleError } from '@/lib/api-helpers'
import { switchPhase } from '@/lib/game-service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await req.json().catch(() => ({})) as { phase?: unknown }

    if (body.phase !== 'ASCENDING' && body.phase !== 'DESCENDING') {
      return Response.json(
        { error: 'phase must be ASCENDING or DESCENDING' },
        { status: 400 },
      )
    }

    await switchPhase(token, body.phase)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
