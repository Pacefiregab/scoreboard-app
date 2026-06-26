import { ok, handleError } from '@/lib/api-helpers'
import { getGame } from '@/lib/game-service'

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
