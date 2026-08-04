import { ok, handleError } from '@/lib/api-helpers'
import { deletePenalty } from '@/lib/game-service'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string; penaltyId: string }> },
) {
  try {
    const { token, penaltyId } = await params
    await deletePenalty(token, penaltyId)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
