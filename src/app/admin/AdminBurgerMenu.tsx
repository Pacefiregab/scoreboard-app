'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutList, Users, Trophy } from 'lucide-react'

const TABS = [
  { id: 'games', label: 'Parties', icon: LayoutList },
  { id: 'players', label: 'Joueurs', icon: Users },
  { id: 'score', label: 'Classement', icon: Trophy },
] as const

type Tab = (typeof TABS)[number]['id']

export function AdminBurgerMenu({ currentTab }: { currentTab: Tab }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu admin"
        className="rounded-lg p-1.5 hover:bg-muted transition-colors"
      >
        <Menu size={18} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-56 bg-background border-l shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-12 border-b shrink-0">
              <span className="text-sm font-semibold">Admin</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {TABS.map(({ id, label, icon: Icon }) => (
                <Link
                  key={id}
                  href={`/admin?tab=${id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    currentTab === id
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
