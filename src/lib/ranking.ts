/**
 * Standard competition ranking ("1224"): tied entries share the same rank and
 * the following rank skips the seats they occupied.
 *
 *   30 pts → 1
 *   30 pts → 1
 *   10 pts → 3   (not 2)
 *    0 pts → 4
 *
 * `items` must already be sorted. `key` returns the value ties are judged on —
 * entries compare equal when their keys are strictly equal, so build a
 * composite (e.g. a joined string) when several fields decide a tie.
 */
export function competitionRanks<T>(items: T[], key: (item: T) => unknown): number[] {
  const ranks: number[] = []
  let currentRank = 1

  items.forEach((item, index) => {
    if (index > 0 && key(item) !== key(items[index - 1]!)) {
      currentRank = index + 1
    }
    ranks.push(currentRank)
  })

  return ranks
}

/** True when at least one other entry shares this entry's rank. */
export function isTied(ranks: number[], index: number): boolean {
  const rank = ranks[index]
  return ranks.filter((r) => r === rank).length > 1
}
