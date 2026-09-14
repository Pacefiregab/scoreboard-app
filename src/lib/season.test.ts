import { describe, it, expect } from 'vitest'
import {
  calendarSeasonFor,
  nextCalendarSeason,
  calendarSeasonsBetween,
  seasonStatus,
  rangesOverlap,
  inclusiveEnd,
  exclusiveEnd,
} from './season'

const d = (iso: string) => new Date(`${iso}T12:00:00.000Z`)
const day = (x: Date) => x.toISOString().slice(0, 10)

describe('calendarSeasonFor', () => {
  it('nomme et borne les quatre saisons', () => {
    expect(calendarSeasonFor(d('2026-04-15')).name).toBe('Printemps 2026')
    expect(calendarSeasonFor(d('2026-07-15')).name).toBe('Été 2026')
    expect(calendarSeasonFor(d('2026-10-15')).name).toBe('Automne 2026')
  })

  it('couvre chaque saison sur trois mois pleins', () => {
    const ete = calendarSeasonFor(d('2026-07-15'))
    expect(day(ete.startsAt)).toBe('2026-06-01')
    expect(day(ete.endsAt)).toBe('2026-09-01') // exclue
  })

  it('fait chevaucher l’hiver sur deux années', () => {
    const decembre = calendarSeasonFor(d('2026-12-20'))
    expect(decembre.name).toBe('Hiver 2026-2027')
    expect(day(decembre.startsAt)).toBe('2026-12-01')
    expect(day(decembre.endsAt)).toBe('2027-03-01')
  })

  it('rattache janvier et février à l’hiver commencé l’année d’avant', () => {
    const janvier = calendarSeasonFor(d('2027-01-10'))
    expect(janvier.name).toBe('Hiver 2026-2027')
    expect(day(janvier.startsAt)).toBe('2026-12-01')
  })

  it('place une date pile sur une borne dans la saison qui commence', () => {
    expect(calendarSeasonFor(new Date('2026-09-01T00:00:00.000Z')).name).toBe('Automne 2026')
  })

  it('range les parties existantes du projet dans Été 2026', () => {
    expect(calendarSeasonFor(d('2026-06-26')).name).toBe('Été 2026')
    expect(calendarSeasonFor(d('2026-08-27')).name).toBe('Été 2026')
  })
})

describe('nextCalendarSeason', () => {
  it('enchaîne sans trou ni recouvrement', () => {
    const ete = calendarSeasonFor(d('2026-07-01'))
    const automne = nextCalendarSeason(ete)
    expect(automne.name).toBe('Automne 2026')
    expect(automne.startsAt.getTime()).toBe(ete.endsAt.getTime())
  })

  it('passe de l’automne à l’hiver puis au printemps', () => {
    const automne = calendarSeasonFor(d('2026-10-01'))
    const hiver = nextCalendarSeason(automne)
    expect(hiver.name).toBe('Hiver 2026-2027')
    expect(nextCalendarSeason(hiver).name).toBe('Printemps 2027')
  })
})

describe('calendarSeasonsBetween', () => {
  it('couvre de la première partie à aujourd’hui', () => {
    const seasons = calendarSeasonsBetween(d('2026-06-26'), d('2026-09-14'))
    expect(seasons.map((s) => s.name)).toEqual(['Été 2026', 'Automne 2026'])
  })

  it('renvoie une seule saison quand tout tient dedans', () => {
    const seasons = calendarSeasonsBetween(d('2026-06-05'), d('2026-08-30'))
    expect(seasons.map((s) => s.name)).toEqual(['Été 2026'])
  })

  it('enchaîne plusieurs années sans trou', () => {
    const seasons = calendarSeasonsBetween(d('2026-06-01'), d('2027-04-01'))
    expect(seasons.map((s) => s.name)).toEqual([
      'Été 2026', 'Automne 2026', 'Hiver 2026-2027', 'Printemps 2027',
    ])
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i]!.startsAt.getTime()).toBe(seasons[i - 1]!.endsAt.getTime())
    }
  })

  it('ne renvoie rien si la fin précède le début', () => {
    expect(calendarSeasonsBetween(d('2026-09-01'), d('2026-06-01'))).toEqual([])
  })
})

describe('seasonStatus', () => {
  const ete = { startsAt: d('2026-06-01'), endsAt: d('2026-09-01') }

  it('distingue à venir, en cours et terminée', () => {
    expect(seasonStatus(ete, d('2026-05-01'))).toBe('upcoming')
    expect(seasonStatus(ete, d('2026-07-01'))).toBe('current')
    expect(seasonStatus(ete, d('2026-10-01'))).toBe('past')
  })

  it('compte le premier instant comme en cours et le dernier comme passé', () => {
    expect(seasonStatus(ete, ete.startsAt)).toBe('current')
    expect(seasonStatus(ete, ete.endsAt)).toBe('past')
  })
})

describe('rangesOverlap', () => {
  const ete = { startsAt: d('2026-06-01'), endsAt: d('2026-09-01') }

  it('ne voit pas de chevauchement entre saisons qui se touchent', () => {
    const automne = { startsAt: d('2026-09-01'), endsAt: d('2026-12-01') }
    expect(rangesOverlap(ete, automne)).toBe(false)
  })

  it('detecte un recouvrement partiel', () => {
    expect(rangesOverlap(ete, { startsAt: d('2026-08-15'), endsAt: d('2026-10-01') })).toBe(true)
  })

  it('detecte une plage entierement incluse', () => {
    expect(rangesOverlap(ete, { startsAt: d('2026-07-01'), endsAt: d('2026-08-01') })).toBe(true)
  })

  it('ne voit rien entre deux plages disjointes', () => {
    expect(rangesOverlap(ete, { startsAt: d('2027-01-01'), endsAt: d('2027-03-01') })).toBe(false)
  })
})

describe('bornes affichées', () => {
  it('montre le dernier jour inclus, pas la borne exclue', () => {
    expect(day(inclusiveEnd(new Date('2026-09-01T00:00:00.000Z')))).toBe('2026-08-31')
  })

  it('fait l’aller-retour sans perte', () => {
    const exclusive = new Date('2026-09-01T00:00:00.000Z')
    expect(exclusiveEnd(inclusiveEnd(exclusive)).getTime()).toBe(exclusive.getTime())
  })
})
