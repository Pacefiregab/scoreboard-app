'use server'

import { deleteGameById } from '@/lib/game-service'
import { revalidatePath } from 'next/cache'

export async function deleteGameAction(id: string) {
  await deleteGameById(id)
  revalidatePath('/admin')
}
