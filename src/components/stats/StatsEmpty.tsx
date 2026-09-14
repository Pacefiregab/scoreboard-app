export function StatsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="text-4xl">📊</div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Aucune statistique disponible</h2>
        <p className="text-muted-foreground text-sm">
          Les statistiques apparaissent une fois une première partie terminée.
        </p>
      </div>
    </div>
  )
}
