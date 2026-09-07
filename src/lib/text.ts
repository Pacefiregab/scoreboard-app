/**
 * Folds a string for searching and comparing names: lowercased, trimmed, and
 * stripped of diacritics, so « Jérémie » is reached by « Jerem » or « jerem ».
 *
 * NFD splits an accented letter into its base letter plus a combining mark,
 * which the regex then removes — « é » becomes « e » rather than being dropped.
 */
export function foldForSearch(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
