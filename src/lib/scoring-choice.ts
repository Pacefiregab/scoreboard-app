import { getScoringConfig } from './game-service'
import { type ScoringConfig, type ScoringMethod } from './scoring'

export interface ResolvedScoring {
  /** Configuration à utiliser pour classer, méthode du visiteur comprise. */
  config: ScoringConfig
  /** Méthode retenue par l'admin, affichée comme étant le défaut. */
  adminMethod: ScoringMethod
  /** `true` quand le visiteur a choisi une autre méthode que celle par défaut. */
  overridden: boolean
  /** Rend le sélecteur, ou non. */
  allowChoice: boolean
}

const METHODS: ScoringMethod[] = ['A', 'B', 'C']

/**
 * Applique le choix de méthode du visiteur, lu dans l'URL.
 *
 * Les pondérations restent celles de l'admin : le visiteur choisit comment on
 * classe, pas comment on pondère. Une valeur inconnue, ou le choix désactivé
 * en admin, retombe silencieusement sur la méthode par défaut.
 */
export async function resolveScoring(param?: string): Promise<ResolvedScoring> {
  const config = await getScoringConfig()
  const allowChoice = config.allowPlayerChoice

  const wanted = METHODS.find((m) => m === param)
  if (!allowChoice || !wanted || wanted === config.method) {
    return { config, adminMethod: config.method, overridden: false, allowChoice }
  }

  return {
    config: { ...config, method: wanted },
    adminMethod: config.method,
    overridden: true,
    allowChoice,
  }
}
