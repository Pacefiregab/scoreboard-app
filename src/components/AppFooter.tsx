'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { LATEST_CHANGELOG_DATE } from '@/data/changelog'
import { ChangelogDialog } from './ChangelogDialog'
import { Bug, ListChecks } from 'lucide-react'

const REPO_URL = 'https://github.com/Pacefiregab/scoreboard-app'
const SEEN_KEY = 'changelog-seen'

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY)
  } catch {
    // Private browsing or storage disabled — behave like a first visit.
    return null
  }
}

function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, LATEST_CHANGELOG_DATE)
  } catch {}
}

// localStorage never changes under us here, so the subscription is a no-op.
// Reading it through useSyncExternalStore rather than an effect keeps the
// server render and the hydrated one in agreement without a cascading render.
const subscribe = () => () => {}
const serverSnapshot = () => null

export function AppFooter() {
  const seen = useSyncExternalStore(subscribe, readSeen, serverSnapshot)

  const [manualOpen, setManualOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // First visit: record the current release. Announcing every past version to
    // someone discovering the app would be noise, so the popup starts from here.
    if (readSeen() === null) writeSeen()
  }, [])

  const isBehind = seen !== null && seen < LATEST_CHANGELOG_DATE
  const open = manualOpen || (isBehind && !dismissed)

  function close() {
    setManualOpen(false)
    setDismissed(true)
    writeSeen()
  }

  return (
    <>
      <footer className="border-t mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <button
            onClick={() => setManualOpen(true)}
            className="hover:text-foreground transition-colors"
          >
            Nouveautés
          </button>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <a
            href={`${REPO_URL}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Bug size={12} />
            Signaler un bug
          </a>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <a
            href={`${REPO_URL}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ListChecks size={12} />
            Suivi des demandes
          </a>
        </div>
      </footer>

      {/* `seen` is still the old value while the dialog is open — it is only
          written on close — so the « nouveau » markers stay correct. */}
      <ChangelogDialog open={open} highlightSince={seen} onClose={close} />
    </>
  )
}
