'use client'

import { Sun, Moon, Heart } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()

  const label = theme === 'light' ? 'Passer en mode sombre' : theme === 'dark' ? 'Passer en thème rose' : 'Passer en mode clair'

  return (
    <button
      onClick={cycleTheme}
      title={label}
      className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
    >
      {theme === 'light' && <Sun size={16} />}
      {theme === 'dark' && <Moon size={16} />}
      {theme === 'rose' && <Heart size={16} className="text-pink-500" />}
    </button>
  )
}
