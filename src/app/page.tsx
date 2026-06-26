import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { JoinForm } from '@/components/JoinForm'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Scoreboard</h1>
        <p className="text-muted-foreground">Suivez vos parties de cartes</p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <Link href="/new" className="w-full">
          <Button size="lg" className="w-full">
            Créer une partie
          </Button>
        </Link>

        <div className="flex items-center gap-2 w-full">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <JoinForm />
      </div>
    </main>
  )
}
