import { ok, handleError } from '@/lib/api-helpers'
import { switchToDescending } from '@/lib/game-service'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    await switchToDescending(token)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
