'use server'

import {
  deleteGameById, mergePlayersByName, deletePlayersByName, saveScoringConfig,
  createSeason, updateSeason, deleteSeason, generateDefaultSeasons,
} from '@/lib/game-service'
import type { ScoringConfig } from '@/lib/scoring'
import { exclusiveEnd } from '@/lib/season'
import { revalidatePath } from 'next/cache'

/** Toutes les vues de statistiques dépendent des saisons. */
function revalidateSeasons() {
  revalidatePath('/admin')
  revalidatePath('/stats', 'layout')
  revalidatePath('/')
}

/** `AAAA-MM-JJ` saisi par l'admin, lu en UTC pour rester stable d'un fuseau à l'autre. */
function parseDay(value: string, label: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) throw new Error(`${label} invalide`)
  return date
}

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

// ─── Saisons ─────────────────────────────────────────────────────────────────

export async function createSeasonAction(
  input: { name: string; startsAt: string; endsAt: string },
): Promise<string> {
  const season = await createSeason(
    input.name,
    parseDay(input.startsAt, 'Date de début'),
    // La saisie donne le dernier jour inclus ; le stockage borne à l'exclu.
    exclusiveEnd(parseDay(input.endsAt, 'Date de fin')),
  )
  revalidateSeasons()
  return `Saison « ${season.name} » créée.`
}

export async function updateSeasonAction(
  id: string,
  input: { name: string; startsAt: string; endsAt: string },
): Promise<string> {
  const season = await updateSeason(id, {
    name: input.name,
    startsAt: parseDay(input.startsAt, 'Date de début'),
    endsAt: exclusiveEnd(parseDay(input.endsAt, 'Date de fin')),
  })
  revalidateSeasons()
  return `Saison « ${season.name} » mise à jour.`
}

export async function deleteSeasonAction(id: string): Promise<string> {
  await deleteSeason(id)
  revalidateSeasons()
  return 'Saison supprimée — ses parties restent intactes, simplement hors saison.'
}

export async function generateSeasonsAction(): Promise<string> {
  const { created, skipped } = await generateDefaultSeasons()
  revalidateSeasons()
  if (created.length === 0) {
    return `Aucune saison à créer — ${skipped} période${skipped !== 1 ? 's' : ''} déjà couverte${skipped !== 1 ? 's' : ''}.`
  }
  return `${created.length} saison${created.length !== 1 ? 's' : ''} créée${created.length !== 1 ? 's' : ''} : ${created.join(', ')}.`
}
