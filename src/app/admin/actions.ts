'use server'

import { deleteGameById, mergePlayersByName, deletePlayersByName, saveScoringConfig } from '@/lib/game-service'
import type { ScoringConfig } from '@/lib/scoring'
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

export async function saveScoringConfigAction(config: ScoringConfig): Promise<void> {
  await saveScoringConfig(config)
  revalidatePath('/stats')
}
