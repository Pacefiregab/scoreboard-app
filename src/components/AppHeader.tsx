'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Props {
  backHref?: string
  backLabel?: string
  title?: string
  children?: React.ReactNode
}

export function AppHeader({
  backHref,
  backLabel = 'Accueil',
  title = 'Scoreboard',
  children,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-3">
        {backHref && (
          <>
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Home size={15} />
              <span className="text-sm hidden sm:inline">{backLabel}</span>
            </Link>
            <div className="h-4 w-px bg-border" />
          </>
        )}
        <span className="text-sm font-semibold flex-1">{title}</span>
        {children}
        <ThemeToggle />
      </div>
    </header>
  )
}
