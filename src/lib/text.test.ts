import { describe, it, expect } from 'vitest'
import { foldForSearch } from './text'

describe('foldForSearch', () => {
  it('strips accents so an unaccented query matches', () => {
    expect(foldForSearch('Jérémie')).toBe('jeremie')
    expect(foldForSearch('Jérémie').includes(foldForSearch('Jerem'))).toBe(true)
    expect(foldForSearch('Jérémie').includes(foldForSearch('jerem'))).toBe(true)
  })

  it('matches in the other direction too — accented query, plain name', () => {
    expect(foldForSearch('Jeremie').includes(foldForSearch('Jérém'))).toBe(true)
  })

  it('lowercases', () => {
    expect(foldForSearch('GAB')).toBe('gab')
  })

  it('trims surrounding spaces', () => {
    expect(foldForSearch('  Alice  ')).toBe('alice')
  })

  it('handles the usual French diacritics', () => {
    expect(foldForSearch('Loïc')).toBe('loic')
    expect(foldForSearch('Chloé')).toBe('chloe')
    expect(foldForSearch('Agnès')).toBe('agnes')
    expect(foldForSearch('Gaëtan')).toBe('gaetan')
    expect(foldForSearch('Théo')).toBe('theo')
    expect(foldForSearch('François')).toBe('francois')
  })

  it('leaves a plain name untouched', () => {
    expect(foldForSearch('Bob')).toBe('bob')
  })

  it('keeps distinct names distinct', () => {
    expect(foldForSearch('Marie')).not.toBe(foldForSearch('Mario'))
  })

  it('handles an empty string', () => {
    expect(foldForSearch('')).toBe('')
  })
})
