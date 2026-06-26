import { ok, handleError } from '@/lib/api-helpers'
import { startNextRound } from '@/lib/game-service'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const round = await startNextRound(token)
    return ok(round, 201)
  } catch (e) {
    return handleError(e)
  }
}
