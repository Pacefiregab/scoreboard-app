'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { STATS_VIEWS, findStatsView } from './views'
import { Menu, Check } from 'lucide-react'

export function statsViewLabel(pathname: string): string {
  return findStatsView(pathname)?.label ?? 'Statistiques'
}

export function StatsNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = findStatsView(pathname)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* The current view is named on the trigger, so the tab in use is
          readable without opening the menu. */}
      <SheetTrigger render={<Button variant="outline" size="sm" className="shrink-0 h-8 gap-1.5" />}>
        <Menu size={15} />
        <span className="hidden sm:inline text-xs font-normal">
          {current?.label ?? 'Vues'}
        </span>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">Statistiques</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-0.5 pb-6">
          {STATS_VIEWS.map(({ href, label, description, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-start gap-3 px-2 py-2.5 rounded-lg transition-colors ${
                  active ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
              >
                <Icon size={16} className={`mt-0.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                    {label}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {description}
                  </span>
                </span>
                {active && <Check size={15} className="text-primary shrink-0 mt-0.5" />}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
