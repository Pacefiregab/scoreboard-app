'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { foldForSearch } from '@/lib/text'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  exclude?: string[]
  autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
}

export function PlayerNameInput({
  value,
  onChange,
  placeholder,
  exclude = [],
  autoFocus,
  onKeyDown,
  className,
}: Props) {
  const [allNames, setAllNames] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((data: { names: string[] }) => setAllNames(data.names))
      .catch(() => {})
  }, [])

  // Folded on both sides so accents and case never hide a match, and so a
  // player already in the game is excluded whichever spelling was used.
  const excludeFolded = exclude.map(foldForSearch).filter(Boolean)
  const query = foldForSearch(value)

  const filtered = allNames
    .filter((n) => {
      const folded = foldForSearch(n)
      return (
        !excludeFolded.includes(folded) &&
        folded !== query &&
        (query === '' || folded.includes(query))
      )
    })
    .slice(0, 8)

  const select = useCallback(
    (name: string) => {
      onChange(name)
      setOpen(false)
      setActiveIndex(-1)
    },
    [onChange],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
        return
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        select(filtered[activeIndex]!)
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setActiveIndex(-1)
        return
      }
    }
    onKeyDown?.(e)
  }

  const showDropdown = open && filtered.length > 0

  return (
    <div className={`relative flex-1 ${className ?? ''}`}>
      <Input
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 top-full mt-1 w-full rounded-lg border bg-popover shadow-md py-1 max-h-52 overflow-y-auto"
        >
          {filtered.map((name, i) => (
            <li
              key={name}
              onClick={() => select(name)}
              className={`px-3 py-1.5 text-sm cursor-pointer transition-colors select-none ${
                i === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
