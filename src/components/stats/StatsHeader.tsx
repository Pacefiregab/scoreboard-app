'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { StatsNav, statsViewLabel } from './StatsNav'

/** Header of the stats section: the current view's name plus the burger menu. */
export function StatsHeader() {
  const pathname = usePathname()
  return (
    <AppHeader backHref="/" title={statsViewLabel(pathname)}>
      <StatsNav />
    </AppHeader>
  )
}
