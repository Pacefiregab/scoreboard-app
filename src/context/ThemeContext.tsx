'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'rose'

const THEMES: Theme[] = ['light', 'dark', 'rose']

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  cycleTheme: () => {},
})

function applyTheme(t: Theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'rose')
  if (t === 'dark') root.classList.add('dark')
  else if (t === 'rose') root.classList.add('rose')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved && THEMES.includes(saved)) {
      setThemeState(saved)
      applyTheme(saved)
    }
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('theme', t)
    applyTheme(t)
  }

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]!
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
