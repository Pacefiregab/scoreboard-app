import Link from 'next/link'
import { listAllGamesAdmin } from '@/lib/game-service'
import { DeleteGameButton } from './DeleteGameButton'

export const dynamic = 'force-dynamic'

function fmt(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export default async function AdminPage() {
  const games = await listAllGamesAdmin()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {games.length} partie{games.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Accueil
        </Link>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Joueurs</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-left px-4 py-3 font-medium">Manches</th>
              <th className="text-left px-4 py-3 font-medium">Créée le</th>
              <th className="text-left px-4 py-3 font-medium">Dernière activité</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium max-w-xs truncate">{game.playerNames.join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 space-x-2">
                    <Link href={`/game/${game.adminToken}`} className="hover:underline">Admin</Link>
                    <span>·</span>
                    <Link href={`/view/${game.viewToken}`} className="hover:underline">Spectateur</Link>
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    game.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {game.status === 'ACTIVE' ? 'En cours' : 'Terminée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {game.roundCount > 0 ? game.roundCount : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {fmt(game.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {fmt(game.lastActivity)}
                </td>
                <td className="px-4 py-3">
                  <DeleteGameButton id={game.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {games.length === 0 && (
          <p className="text-center py-12 text-muted-foreground text-sm">Aucune partie</p>
        )}
      </div>
    </main>
  )
}
