export type ScoringMethod = 'A' | 'B' | 'C'

export interface ScoringConfig {
  method: ScoringMethod
  weights: { wins: number; score: number; contract: number }
}

export const DEFAULT_CONFIG: ScoringConfig = {
  method: 'B',
  weights: { wins: 0.4, score: 0.35, contract: 0.25 },
}

export const METHOD_META: Record<ScoringMethod, { label: string; desc: string }> = {
  A: {
    label: 'Composite pondéré',
    desc: 'Métriques normalisées et pondérées par des coefficients configurables',
  },
  B: {
    label: 'Points F1',
    desc: 'Chaque partie distribue 10 / 6 / 3 / 1 pts selon le classement final',
  },
  C: {
    label: 'Lexicographique',
    desc: 'Victoires → score moyen → taux de contrats (aucun score synthétique)',
  },
}

interface Rankable {
  name: string
  wins: number
  winRate: number
  avgFinalScore: number
  contractRate: number
  f1Points: number
}

function normalize(values: number[]): number[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0.5)
  return values.map((v) => (v - min) / (max - min))
}

export function rankByConfig<T extends Rankable>(stats: T[], cfg: ScoringConfig): T[] {
  if (!stats.length) return stats

  if (cfg.method === 'C') {
    return [...stats].sort(
      (a, b) =>
        b.wins - a.wins ||
        b.avgFinalScore - a.avgFinalScore ||
        b.contractRate - a.contractRate,
    )
  }

  if (cfg.method === 'B') {
    return [...stats].sort((a, b) => b.f1Points - a.f1Points || b.wins - a.wins)
  }

  // Method A — weighted composite
  const nWR = normalize(stats.map((s) => s.winRate))
  const nAS = normalize(stats.map((s) => s.avgFinalScore))
  const nCR = normalize(stats.map((s) => s.contractRate))
  const { wins: wW, score: wS, contract: wC } = cfg.weights

  return [...stats]
    .map((s, i) => ({
      stat: s,
      v: wW * (nWR[i] ?? 0) + wS * (nAS[i] ?? 0) + wC * (nCR[i] ?? 0),
    }))
    .sort((a, b) => b.v - a.v)
    .map((x) => x.stat)
}

export function computeComposites<T extends Rankable>(
  stats: T[],
  cfg: ScoringConfig,
): Map<string, number> {
  if (cfg.method !== 'A' || !stats.length) return new Map()
  const nWR = normalize(stats.map((s) => s.winRate))
  const nAS = normalize(stats.map((s) => s.avgFinalScore))
  const nCR = normalize(stats.map((s) => s.contractRate))
  const { wins: wW, score: wS, contract: wC } = cfg.weights
  return new Map(
    stats.map((s, i) => [
      s.name,
      Math.round((wW * (nWR[i] ?? 0) + wS * (nAS[i] ?? 0) + wC * (nCR[i] ?? 0)) * 100),
    ]),
  )
}
