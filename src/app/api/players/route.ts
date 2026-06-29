import { ok, handleError } from '@/lib/api-helpers'
import { getKnownPlayerNames } from '@/lib/game-service'

export async function GET() {
  try {
    const names = await getKnownPlayerNames()
    return ok({ names })
  } catch (e) {
    return handleError(e)
  }
}
