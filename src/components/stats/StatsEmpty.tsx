export function StatsEmpty({ season }: { season?: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-4xl">📊</div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {season ? `Aucune partie pour ${season}` : 'Aucune statistique disponible'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {season
            ? 'Choisissez une autre saison, ou « Toutes les saisons ».'
            : 'Les statistiques apparaissent une fois une première partie terminée.'}
        </p>
      </div>
    </div>
  )
}
