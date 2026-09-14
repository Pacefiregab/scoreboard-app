'use client'

import { AppHeader } from '@/components/AppHeader'
import { StatsNav } from './StatsNav'

/**
 * En-tête de la section. Il nomme la section, pas la vue : celle-ci est portée
 * par le déclencheur du menu et par le titre de la page, pour éviter de répéter
 * trois fois le même libellé.
 */
export function StatsHeader() {
  return (
    <AppHeader backHref="/" title="Statistiques">
      <StatsNav />
    </AppHeader>
  )
}
