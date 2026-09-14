/**
 * Saisons calendaires (météorologiques, hémisphère nord) : trois mois pleins,
 * l'hiver chevauchant deux années.
 *
 * Les bornes suivent la convention `[startsAt, endsAt[` — début inclus, fin
 * exclue. Deux saisons consécutives partagent donc exactement la même date
 * pivot, ce qui rend impossible un trou ou un chevauchement d'un jour, et
 * évite toute question de fin de journée.
 */
export interface SeasonRange {
  name: string
  startsAt: Date
  /** Exclue : la saison suivante commence à cet instant précis. */
  endsAt: Date
}

function utc(year: number, month: number, day = 1): Date {
  return new Date(Date.UTC(year, month, day))
}

/** La saison calendaire contenant `date`. */
export function calendarSeasonFor(date: Date): SeasonRange {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()

  if (m >= 2 && m <= 4) return { name: `Printemps ${y}`, startsAt: utc(y, 2), endsAt: utc(y, 5) }
  if (m >= 5 && m <= 7) return { name: `Été ${y}`, startsAt: utc(y, 5), endsAt: utc(y, 8) }
  if (m >= 8 && m <= 10) return { name: `Automne ${y}`, startsAt: utc(y, 8), endsAt: utc(y, 11) }

  // Décembre ouvre l'hiver ; janvier et février terminent celui de l'an passé.
  const winterYear = m === 11 ? y : y - 1
  return {
    name: `Hiver ${winterYear}-${winterYear + 1}`,
    startsAt: utc(winterYear, 11),
    endsAt: utc(winterYear + 1, 2),
  }
}

/** La saison calendaire qui suit celle donnée. */
export function nextCalendarSeason(season: SeasonRange): SeasonRange {
  return calendarSeasonFor(season.endsAt)
}

/**
 * Toutes les saisons calendaires nécessaires pour couvrir `[from, to]`, de la
 * plus ancienne à la plus récente. Sert à rattraper l'historique : la première
 * partie jouée donne le point de départ.
 */
export function calendarSeasonsBetween(from: Date, to: Date): SeasonRange[] {
  if (to < from) return []

  const seasons: SeasonRange[] = []
  let current = calendarSeasonFor(from)

  // Borne de sécurité : une saison par trimestre, donc 400 couvre un siècle.
  for (let i = 0; i < 400; i++) {
    seasons.push(current)
    if (current.endsAt > to) break
    current = nextCalendarSeason(current)
  }

  return seasons
}

export type SeasonStatus = 'upcoming' | 'current' | 'past'

/** Le statut se lit des dates : rien à archiver, rien à oublier de clôturer. */
export function seasonStatus(
  season: { startsAt: Date; endsAt: Date },
  now: Date = new Date(),
): SeasonStatus {
  if (now < season.startsAt) return 'upcoming'
  if (now >= season.endsAt) return 'past'
  return 'current'
}

/** Deux plages se chevauchent dès qu'une commence avant que l'autre ne finisse. */
export function rangesOverlap(
  a: { startsAt: Date; endsAt: Date },
  b: { startsAt: Date; endsAt: Date },
): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt
}

/** Date de fin telle qu'on la montre : dernier jour inclus, donc la veille. */
export function inclusiveEnd(endsAt: Date): Date {
  return new Date(endsAt.getTime() - 86_400_000)
}

/** Inverse de `inclusiveEnd`, pour convertir une saisie d'admin en borne exclue. */
export function exclusiveEnd(lastDay: Date): Date {
  return new Date(lastDay.getTime() + 86_400_000)
}
