import { StatsHeader } from '@/components/stats/StatsHeader'

export const metadata = { title: 'Statistiques' }

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <StatsHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-12">{children}</main>
    </div>
  )
}
