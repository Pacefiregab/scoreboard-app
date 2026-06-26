import { ok, handleError } from '@/lib/api-helpers'
import { cancelGame } from '@/lib/game-service'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    await cancelGame(token)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
