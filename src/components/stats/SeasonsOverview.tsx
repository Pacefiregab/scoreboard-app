import Link from 'next/link'

export interface SeasonOverviewRow {
  id: string
  name: string
  startsAt: string
  endsAt: string
  status: 'upcoming' | 'current' | 'past'
  gameCount: number
  playerCount: number
  /** Vainqueurs — plusieurs en cas d'ex æquo. */
  champions: string[]
  /** Valeur qui a servi au classement, dans l'unité de la méthode active. */
  championValue: string
}

const STATUS = {
  current: { label: 'en cours', className: 'border-primary/40 bg-primary/10 text-foreground' },
  upcoming: { label: 'à venir', className: 'border-border text-muted-foreground' },
  past: { label: 'terminée', className: 'border-border text-muted-foreground' },
} as const

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))

/**
 * Une ligne par saison, avec son champion. Vue transversale : pour le podium
 * complet et les records d'une saison, on la sélectionne dans le sélecteur de
 * période, qui affiche alors son récap détaillé.
 */
export function SeasonsOverview({ seasons }: { seasons: SeasonOverviewRow[] }) {
  if (seasons.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aucune saison définie. Un administrateur peut les créer depuis la page admin —
        les saisons calendaires se génèrent en un clic et rattrapent l’historique.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {seasons.map((season) => {
        const status = STATUS[season.status]
        return (
          <div key={season.id} className="rounded-xl border p-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="font-semibold">{season.name}</h2>
                <p className="text-xs text-muted-foreground">
                  Du {fmt(season.startsAt)} au {fmt(season.endsAt)} · {season.gameCount} partie
                  {season.gameCount !== 1 ? 's' : ''}
                  {season.playerCount > 0 && ` · ${season.playerCount} joueur${season.playerCount !== 1 ? 's' : ''}`}
                </p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${status.className}`}>
                {status.label}
              </span>
            </div>

            {season.champions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune partie terminée sur cette période.</p>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0">🥇</span>
                <span className="font-medium truncate">{season.champions.join(', ')}</span>
                <span className="text-xs text-muted-foreground shrink-0">{season.championValue}</span>
              </div>
            )}

            {season.gameCount > 0 && (
              <div className="flex gap-3 text-xs">
                <Link href={`/stats?saison=${season.id}`} className="text-primary hover:underline">
                  Récap détaillé →
                </Link>
                <Link
                  href={`/stats/classement?saison=${season.id}`}
                  className="text-primary hover:underline"
                >
                  Classement complet →
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
