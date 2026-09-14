'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Trophy, TrendingUp, CalendarDays, History, Check } from 'lucide-react'

export const STATS_VIEWS = [
  { href: '/stats', label: 'Classement général', icon: Trophy },
  { href: '/stats/detail', label: 'Stats détaillées', icon: TrendingUp },
  { href: '/stats/semaine', label: 'Récap de la semaine', icon: CalendarDays },
  { href: '/stats/historique', label: 'Historique des parties', icon: History },
] as const

export function statsViewLabel(pathname: string): string {
  // Longest match first, so /stats/detail never resolves to /stats.
  const match = [...STATS_VIEWS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((v) => pathname === v.href)
  return match?.label ?? 'Statistiques'
}

export function StatsNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 h-8 w-8" />}>
        <Menu size={16} />
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">Statistiques</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 pb-6">
          {STATS_VIEWS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-1 py-3 text-sm rounded-lg transition-colors ${
                  active ? 'text-foreground font-medium' : 'hover:bg-muted'
                }`}
              >
                <Icon size={16} className="text-muted-foreground" />
                <span className="flex-1">{label}</span>
                {active && <Check size={15} className="text-primary" />}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
