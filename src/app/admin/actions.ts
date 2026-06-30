'use server'

import { deleteGameById, mergePlayersByName, deletePlayersByName } from '@/lib/game-service'
import { revalidatePath } from 'next/cache'

export async function deleteGameAction(id: string) {
  await deleteGameById(id)
  revalidatePath('/admin')
}

export async function mergePlayersAction(fromName: string, toName: string): Promise<number> {
  const count = await mergePlayersByName(fromName, toName)
  revalidatePath('/admin')
  revalidatePath('/stats')
  return count
}

export async function deletePlayersAction(name: string): Promise<number> {
  const count = await deletePlayersByName(name)
  revalidatePath('/admin')
  revalidatePath('/stats')
  return count
}
