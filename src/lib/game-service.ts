import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { computeRoundScores, isLastBetValid, isGameOver, nextCardCount } from './enculette'
import { resolveConstrainedPlayerId, nextConstrainedPlayerId } from './constrained-player'
import { ApiError } from './api-helpers'
import type { GameState, RoundState } from '@/types/game'
import { DEFAULT_CONFIG, type ScoringConfig } from './scoring'

// ─── Prisma include + inferred type ─────────────────────────────────────────

const gameInclude = {
  players: { orderBy: { order: 'asc' as const } },
  rounds: {
    orderBy: { number: 'asc' as const },
    include: { bets: true, scores: true },
  },
} satisfies Prisma.GameInclude

type GameWithRelations = Prisma.GameGetPayload<{ include: typeof gameInclude }>

// ─── Shape builder ───────────────────────────────────────────────────────────

function buildGameState(game: GameWithRelations, isAdmin: boolean): GameState {
  const players = game.players.map((p) => {
    const lastScore = game.rounds
      .flatMap((r) => r.scores)
      .filter((s) => s.playerId === p.id)
      .at(-1)

    return {
      id: p.id,
      name: p.name,
      order: p.order,
      active: p.active,
      initialScore: p.initialScore,
      totalScore: lastScore ? lastScore.totalPoints : p.initialScore,
    }
  })

  const rounds: RoundState[] = game.rounds.map((r) => ({
    id: r.id,
    number: r.number,
    cardCount: r.cardCount,
    status: r.status,
    constrainedPlayerId: r.constrainedPlayerId,
    bets: r.bets.map((b) => ({
      playerId: b.playerId,
      announced: b.announced,
      actual: b.actual,
    })),
    scores: r.scores.map((s) => ({
      playerId: s.playerId,
      points: s.points,
      totalPoints: s.totalPoints,
    })),
  }))

  return {
    id: game.id,
    adminToken: game.adminToken,
    viewToken: game.viewToken,
    status: game.status,
    phase: game.phase,
    isAdmin,
    players,
    rounds,
  }
}

// ─── Admin panel ─────────────────────────────────────────────────────────────

export interface AdminGameSummary {
  id: string
  adminToken: string
  viewToken: string
  status: 'ACTIVE' | 'FINISHED'
  playerNames: string[]
  roundCount: number
  createdAt: Date
  lastActivity: Date
}

export async function listAllGamesAdmin(): Promise<AdminGameSummary[]> {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      players: { orderBy: { order: 'asc' }, select: { name: true } },
      rounds: { orderBy: { number: 'desc' }, take: 1, select: { number: true, createdAt: true } },
    },
  })

  return games.map((g) => ({
    id: g.id,
    adminToken: g.adminToken,
    viewToken: g.viewToken,
    status: g.status as 'ACTIVE' | 'FINISHED',
    playerNames: g.players.map((p) => p.name),
    roundCount: g.rounds[0]?.number ?? 0,
    createdAt: g.createdAt,
    lastActivity: g.rounds[0]?.createdAt ?? g.createdAt,
  }))
}

export async function deleteGameById(id: string): Promise<void> {
  const game = await prisma.game.findUnique({ where: { id } })
  if (!game) throw new ApiError('Game not found', 404)
  await prisma.game.delete({ where: { id } })
}

// ─── Active games list ───────────────────────────────────────────────────────

export interface GameSummary {
  viewToken: string
  playerNames: string[]
  roundNumber: number | null
}

export async function listActiveGames(): Promise<GameSummary[]> {
  const games = await prisma.game.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      players: { orderBy: { order: 'asc' }, select: { name: true } },
      rounds: { orderBy: { number: 'desc' }, take: 1, select: { number: true } },
    },
  })

  return games.map((g) => ({
    viewToken: g.viewToken,
    playerNames: g.players.map((p) => p.name),
    roundNumber: g.rounds[0]?.number ?? null,
  }))
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function findActiveGameByAdminToken(adminToken: string): Promise<GameWithRelations> {
  const game = await prisma.game.findUnique({
    where: { adminToken },
    include: gameInclude,
  })
  if (!game) throw new ApiError('Game not found', 404)
  if (game.status === 'FINISHED') throw new ApiError('Game is already finished', 409)
  return game
}

// ─── Service functions ───────────────────────────────────────────────────────

export async function createGame(playerNames: string[]): Promise<GameState> {
  if (playerNames.length === 0) throw new ApiError('At least one player is required', 400)

  const game = await prisma.game.create({
    data: {
      players: {
        create: playerNames.map((name, index) => ({
          name: name.trim(),
          order: index,
        })),
      },
    },
    include: gameInclude,
  })

  return buildGameState(game, true)
}

export async function getGame(token: string): Promise<GameState> {
  const game = await prisma.game.findFirst({
    where: { OR: [{ adminToken: token }, { viewToken: token }] },
    include: gameInclude,
  })
  if (!game) throw new ApiError('Game not found', 404)
  return buildGameState(game, game.adminToken === token)
}

export async function startNextRound(adminToken: string): Promise<RoundState> {
  const game = await findActiveGameByAdminToken(adminToken)
  const lastRound = game.rounds.at(-1)

  if (lastRound && lastRound.status !== 'DONE') {
    throw new ApiError('Current round is not finished yet', 409)
  }

  const cardCount = lastRound
    ? nextCardCount({ current: lastRound.cardCount, phase: game.phase })
    : 1

  if (isGameOver({ cardCount, phase: game.phase })) {
    throw new ApiError('Game is already over — call /finish to end it', 409)
  }

  // Once a round carries an explicit constraint, the rotation resumes from that
  // seat instead of the position it would have reached on its own — so the
  // manual move shifts every following round rather than being undone by one.
  let constrainedPlayerId: string | null = null
  if (lastRound?.constrainedPlayerId) {
    const activePlayers = game.players.filter((p) => p.active).sort((a, b) => a.order - b.order)
    const previous = resolveConstrainedPlayerId(
      activePlayers,
      lastRound.number,
      lastRound.constrainedPlayerId,
    )
    constrainedPlayerId = nextConstrainedPlayerId(activePlayers, previous) ?? null
  }

  const round = await prisma.round.create({
    data: {
      gameId: game.id,
      number: lastRound ? lastRound.number + 1 : 1,
      cardCount,
      constrainedPlayerId,
    },
  })

  return {
    id: round.id,
    number: round.number,
    cardCount: round.cardCount,
    status: round.status,
    constrainedPlayerId: round.constrainedPlayerId,
    bets: [],
    scores: [],
  }
}

export async function submitBets(
  adminToken: string,
  roundId: string,
  bets: { playerId: string; announced: number }[],
): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const round = game.rounds.find((r) => r.id === roundId)

  if (!round) throw new ApiError('Round not found', 404)
  if (round.status !== 'BETTING') throw new ApiError('Round is not in betting phase', 409)

  const activePlayers = game.players.filter((p) => p.active)
  const playerIds = activePlayers.map((p) => p.id)
  const betPlayerIds = bets.map((b) => b.playerId)
  const missing = playerIds.filter((id) => !betPlayerIds.includes(id))
  const unknown = betPlayerIds.filter((id) => !playerIds.includes(id))

  if (missing.length > 0) throw new ApiError('Missing bets for some players', 400)
  if (unknown.length > 0) throw new ApiError('Unknown player in bets', 400)

  // The constrained player rotates each round (display order stays fixed):
  // round 1 → last player, round 2 → first, round 3 → second, etc.
  // An admin-set override on the round wins over that rotation.
  const sortedPlayers = [...activePlayers].sort((a, b) => a.order - b.order)
  const constrainedPlayerId = resolveConstrainedPlayerId(
    sortedPlayers,
    round.number,
    round.constrainedPlayerId,
  )!
  const constrainedBet = bets.find((b) => b.playerId === constrainedPlayerId)!
  const sumOfOthers = bets
    .filter((b) => b.playerId !== constrainedPlayerId)
    .reduce((sum, b) => sum + b.announced, 0)

  if (constrainedBet.announced === round.cardCount - sumOfOthers) {
    throw new ApiError(
      `Ce joueur ne peut pas parier ${constrainedBet.announced} — la somme égalerait le nombre de cartes (${round.cardCount})`,
      422,
    )
  }

  await prisma.$transaction([
    prisma.bet.createMany({ data: bets.map((b) => ({ roundId, playerId: b.playerId, announced: b.announced })) }),
    prisma.round.update({ where: { id: roundId }, data: { status: 'PLAYING' } }),
  ])
}

export async function resetBets(adminToken: string, roundId: string): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const round = game.rounds.find((r) => r.id === roundId)
  if (!round) throw new ApiError('Round not found', 404)
  if (round.status !== 'PLAYING') throw new ApiError('Round is not in playing phase', 409)

  await prisma.$transaction([
    prisma.bet.deleteMany({ where: { roundId } }),
    prisma.round.update({ where: { id: roundId }, data: { status: 'BETTING' } }),
  ])
}

export async function submitResults(
  adminToken: string,
  roundId: string,
  results: { playerId: string; actual: number }[],
): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const round = game.rounds.find((r) => r.id === roundId)

  if (!round) throw new ApiError('Round not found', 404)
  if (round.status !== 'PLAYING') throw new ApiError('Round is not in playing phase', 409)

  const totalActual = results.reduce((sum, r) => sum + r.actual, 0)
  if (totalActual !== round.cardCount) {
    throw new ApiError(
      `La somme des plis (${totalActual}) doit être égale au nombre de cartes (${round.cardCount})`,
      422,
    )
  }

  const betsWithActual = round.bets.map((bet) => {
    const result = results.find((r) => r.playerId === bet.playerId)
    if (!result) throw new ApiError(`Missing result for player ${bet.playerId}`, 400)
    return { playerId: bet.playerId, announced: bet.announced, actual: result.actual }
  })

  const scored = computeRoundScores(betsWithActual)

  const prevScores = new Map(
    game.players.map((p) => {
      const last = game.rounds
        .filter((r) => r.status === 'DONE')
        .flatMap((r) => r.scores)
        .filter((s) => s.playerId === p.id)
        .at(-1)
      return [p.id, last ? last.totalPoints : p.initialScore]
    }),
  )

  await prisma.$transaction([
    ...results.map((r) =>
      prisma.bet.update({
        where: { roundId_playerId: { roundId, playerId: r.playerId } },
        data: { actual: r.actual },
      }),
    ),
    prisma.roundScore.createMany({
      data: scored.map((s) => ({
        roundId,
        playerId: s.playerId,
        points: s.points,
        totalPoints: (prevScores.get(s.playerId) ?? 0) + s.points,
      })),
    }),
    prisma.round.update({ where: { id: roundId }, data: { status: 'DONE' } }),
  ])
}

export async function switchToDescending(adminToken: string): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  if (game.phase === 'DESCENDING') throw new ApiError('Game is already in descending phase', 409)

  const lastRound = game.rounds.at(-1)
  if (lastRound && lastRound.status !== 'DONE') {
    throw new ApiError('Current round must be finished before switching phase', 409)
  }

  await prisma.game.update({ where: { id: game.id }, data: { phase: 'DESCENDING' } })
}

export async function finishGame(adminToken: string): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const lastRound = game.rounds.at(-1)

  if (lastRound?.status === 'PLAYING') {
    throw new ApiError('Impossible de terminer la partie pendant la saisie des résultats', 409)
  }

  await prisma.game.update({
    where: { id: game.id },
    data: { status: 'FINISHED', finishedAt: new Date() },
  })
}

export async function addPlayer(
  adminToken: string,
  name: string,
  initialScore: number,
  order: number,
): Promise<{ id: string }> {
  const game = await findActiveGameByAdminToken(adminToken)
  const insertAt = Math.min(order, game.players.length)
  const playersToShift = game.players.filter((p) => p.order >= insertAt)

  const [, created] = await prisma.$transaction([
    prisma.player.updateMany({
      where: { id: { in: playersToShift.map((p) => p.id) } },
      data: { order: { increment: 1 } },
    }),
    prisma.player.create({
      data: { gameId: game.id, name: name.trim(), order: insertAt, initialScore },
      select: { id: true },
    }),
  ])
  return created
}

/**
 * Assigns absolute positions (and active flags) to every player in one
 * transaction. Patching players one by one races: each request recomputes the
 * shift from its own snapshot, so concurrent calls land on conflicting orders.
 */
export async function reorderPlayers(
  adminToken: string,
  entries: { id: string; order: number; active: boolean }[],
): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const known = new Set(game.players.map((p) => p.id))

  const unknown = entries.filter((e) => !known.has(e.id))
  if (unknown.length > 0) throw new ApiError('Unknown player in reorder', 400)
  if (entries.length !== game.players.length) {
    throw new ApiError('Reorder must list every player of the game', 400)
  }
  if (!entries.some((e) => e.active)) {
    throw new ApiError('Au moins un joueur doit rester actif', 422)
  }

  await prisma.$transaction(
    entries.map((e) =>
      prisma.player.update({ where: { id: e.id }, data: { order: e.order, active: e.active } }),
    ),
  )
}

// ─── Admin: player management ────────────────────────────────────────────────

export interface PlayerEntry {
  name: string
  count: number
}

export async function getDistinctPlayerNames(): Promise<PlayerEntry[]> {
  const rows = await prisma.player.findMany({ select: { name: true } })
  const map = new Map<string, { name: string; count: number }>()
  for (const { name } of rows) {
    const key = name.trim().toLowerCase()
    const existing = map.get(key)
    if (existing) existing.count++
    else map.set(key, { name: name.trim(), count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export async function mergePlayersByName(fromName: string, toName: string): Promise<number> {
  const result = await prisma.player.updateMany({
    where: { name: fromName },
    data: { name: toName },
  })
  return result.count
}

export async function deletePlayersByName(name: string): Promise<number> {
  const result = await prisma.player.deleteMany({ where: { name } })
  return result.count
}

// ─── Known player names (for autocomplete) ───────────────────────────────────

export async function getKnownPlayerNames(): Promise<string[]> {
  const rows = await prisma.player.findMany({ select: { name: true } })
  const freq = new Map<string, { name: string; count: number }>()
  for (const { name } of rows) {
    const key = name.trim().toLowerCase()
    const existing = freq.get(key)
    if (existing) existing.count++
    else freq.set(key, { name: name.trim(), count: 1 })
  }
  return [...freq.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((v) => v.name)
}

// ─── Player stats ────────────────────────────────────────────────────────────

export interface PlayerStat {
  name: string
  gamesPlayed: number
  wins: number
  winRate: number
  roundsPlayed: number
  betsWon: number
  contractRate: number
  avgFinalScore: number
  bestScore: number
  f1Points: number
}

export async function getPlayerStats(options?: { finishedSince?: Date }): Promise<PlayerStat[]> {
  const games = await prisma.game.findMany({
    where: {
      status: 'FINISHED',
      ...(options?.finishedSince ? { finishedAt: { gte: options.finishedSince } } : {}),
    },
    include: {
      players: true,
      rounds: {
        where: { status: 'DONE' },
        orderBy: { number: 'asc' as const },
        include: { bets: true, scores: true },
      },
    },
  })

  const F1 = [10, 6, 3, 1]

  // key = trimmed lowercase name
  const accum = new Map<string, {
    name: string
    gamesPlayed: number
    wins: number
    roundsPlayed: number
    betsWon: number
    scoreSum: number
    bestScore: number
    f1Points: number
  }>()

  for (const game of games) {
    // Compute final score per player in this game
    const finalScores = new Map<string, number>()
    for (const player of game.players) {
      const last = game.rounds.flatMap((r) => r.scores).filter((s) => s.playerId === player.id).at(-1)
      finalScores.set(player.id, last ? last.totalPoints : player.initialScore)
    }

    const maxScore = Math.max(...finalScores.values())
    const winnerIds = new Set(
      [...finalScores.entries()].filter(([, s]) => s === maxScore).map(([id]) => id),
    )

    // F1 points: rank players by final score, assign 10/6/3/1 (ties share the same rank)
    const sortedForF1 = [...game.players].sort(
      (a, b) => (finalScores.get(b.id) ?? 0) - (finalScores.get(a.id) ?? 0),
    )
    const gameF1 = new Map<string, number>()
    let f1Rank = 0
    let prevF1Score: number | null = null
    for (let i = 0; i < sortedForF1.length; i++) {
      const p = sortedForF1[i]!
      const sc = finalScores.get(p.id) ?? 0
      if (sc !== prevF1Score) f1Rank = i
      gameF1.set(p.id, F1[f1Rank] ?? 0)
      prevF1Score = sc
    }

    for (const player of game.players) {
      const key = player.name.trim().toLowerCase()
      const existing = accum.get(key) ?? {
        name: player.name.trim(),
        gamesPlayed: 0,
        wins: 0,
        roundsPlayed: 0,
        betsWon: 0,
        scoreSum: 0,
        bestScore: -Infinity,
        f1Points: 0,
      }

      const finalScore = finalScores.get(player.id) ?? 0
      const playerBets = game.rounds.flatMap((r) => r.bets).filter((b) => b.playerId === player.id && b.actual !== null)
      const won = playerBets.filter((b) => b.actual === b.announced).length

      accum.set(key, {
        ...existing,
        gamesPlayed: existing.gamesPlayed + 1,
        wins: existing.wins + (winnerIds.has(player.id) ? 1 : 0),
        roundsPlayed: existing.roundsPlayed + playerBets.length,
        betsWon: existing.betsWon + won,
        scoreSum: existing.scoreSum + finalScore,
        bestScore: Math.max(existing.bestScore, finalScore),
        f1Points: existing.f1Points + (gameF1.get(player.id) ?? 0),
      })
    }
  }

  return [...accum.values()]
    .map((s) => ({
      name: s.name,
      gamesPlayed: s.gamesPlayed,
      wins: s.wins,
      winRate: s.gamesPlayed > 0 ? s.wins / s.gamesPlayed : 0,
      roundsPlayed: s.roundsPlayed,
      betsWon: s.betsWon,
      contractRate: s.roundsPlayed > 0 ? s.betsWon / s.roundsPlayed : 0,
      avgFinalScore: s.gamesPlayed > 0 ? Math.round(s.scoreSum / s.gamesPlayed) : 0,
      bestScore: s.bestScore === -Infinity ? 0 : s.bestScore,
      f1Points: s.f1Points,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed)
}

// ─── Scoring config ───────────────────────────────────────────────────────────

export async function getScoringConfig(): Promise<ScoringConfig> {
  const setting = await prisma.setting.findUnique({ where: { key: 'scoringConfig' } })
  if (!setting) return DEFAULT_CONFIG
  try {
    return JSON.parse(setting.value) as ScoringConfig
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function saveScoringConfig(config: ScoringConfig): Promise<void> {
  await prisma.setting.upsert({
    where: { key: 'scoringConfig' },
    update: { value: JSON.stringify(config) },
    create: { key: 'scoringConfig', value: JSON.stringify(config) },
  })
}

export async function cancelGame(adminToken: string): Promise<void> {
  const game = await prisma.game.findUnique({ where: { adminToken } })
  if (!game) throw new ApiError('Game not found', 404)
  await prisma.game.delete({ where: { id: game.id } })
}

export async function updateRoundCardCount(
  adminToken: string,
  roundId: string,
  cardCount: number,
): Promise<void> {
  if (cardCount < 1) throw new ApiError('Card count must be at least 1', 400)
  const game = await findActiveGameByAdminToken(adminToken)
  const round = game.rounds.find((r) => r.id === roundId)
  if (!round) throw new ApiError('Round not found', 404)
  if (round.status !== 'BETTING') throw new ApiError('Can only change card count during betting phase', 409)
  await prisma.round.update({ where: { id: roundId }, data: { cardCount } })
}

/** Sets (or clears, with null) the manual constrained-player override. */
export async function updateRoundConstrainedPlayer(
  adminToken: string,
  roundId: string,
  playerId: string | null,
): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const round = game.rounds.find((r) => r.id === roundId)
  if (!round) throw new ApiError('Round not found', 404)
  if (round.status !== 'BETTING') {
    throw new ApiError('Le joueur contraint ne peut être changé que pendant les paris', 409)
  }
  if (playerId !== null) {
    const player = game.players.find((p) => p.id === playerId)
    if (!player) throw new ApiError('Player not found', 404)
    if (!player.active) throw new ApiError('Un joueur désactivé ne peut pas être contraint', 422)
  }
  await prisma.round.update({ where: { id: roundId }, data: { constrainedPlayerId: playerId } })
}

export async function updatePlayer(
  adminToken: string,
  playerId: string,
  data: { name?: string; order?: number; active?: boolean },
): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const player = game.players.find((p) => p.id === playerId)
  if (!player) throw new ApiError('Player not found', 404)

  if (data.order !== undefined && data.order !== player.order) {
    const movingDown = data.order > player.order
    const playersToShift = game.players.filter((p) =>
      movingDown
        ? p.order > player.order && p.order <= data.order!
        : p.order >= data.order! && p.order < player.order,
    )

    await prisma.$transaction([
      ...playersToShift.map((p) =>
        prisma.player.update({ where: { id: p.id }, data: { order: movingDown ? p.order - 1 : p.order + 1 } }),
      ),
      prisma.player.update({
        where: { id: playerId },
        data: { order: data.order, ...(data.name ? { name: data.name.trim() } : {}) },
      }),
    ])
  } else if (data.name) {
    await prisma.player.update({ where: { id: playerId }, data: { name: data.name.trim() } })
  }

  if (data.active !== undefined) {
    await prisma.player.update({ where: { id: playerId }, data: { active: data.active } })
  }
}
