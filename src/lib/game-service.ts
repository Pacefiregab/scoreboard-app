import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { computeRoundScores, isLastBetValid, isGameOver, nextCardCount } from './enculette'
import { ApiError } from './api-helpers'
import type { GameState, RoundState } from '@/types/game'

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

  const round = await prisma.round.create({
    data: {
      gameId: game.id,
      number: lastRound ? lastRound.number + 1 : 1,
      cardCount,
    },
  })

  return {
    id: round.id,
    number: round.number,
    cardCount: round.cardCount,
    status: round.status,
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

  const playerIds = game.players.map((p) => p.id)
  const betPlayerIds = bets.map((b) => b.playerId)
  const missing = playerIds.filter((id) => !betPlayerIds.includes(id))
  const unknown = betPlayerIds.filter((id) => !playerIds.includes(id))

  if (missing.length > 0) throw new ApiError('Missing bets for some players', 400)
  if (unknown.length > 0) throw new ApiError('Unknown player in bets', 400)

  // The constrained player rotates each round (display order stays fixed):
  // round 1 → last player, round 2 → first, round 3 → second, etc.
  // Constrained index = (round.number - 2 + n) % n
  const sortedPlayers = [...game.players].sort((a, b) => a.order - b.order)
  const n = sortedPlayers.length
  const constrainedPlayer = sortedPlayers[(round.number - 2 + n) % n]!
  const constrainedBet = bets.find((b) => b.playerId === constrainedPlayer.id)!
  const sumOfOthers = bets
    .filter((b) => b.playerId !== constrainedPlayer.id)
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

export async function addPlayer(adminToken: string, name: string, initialScore: number, order: number): Promise<void> {
  const game = await findActiveGameByAdminToken(adminToken)
  const insertAt = Math.min(order, game.players.length)
  const playersToShift = game.players.filter((p) => p.order >= insertAt)

  await prisma.$transaction([
    ...playersToShift.map((p) =>
      prisma.player.update({ where: { id: p.id }, data: { order: p.order + 1 } }),
    ),
    prisma.player.create({ data: { gameId: game.id, name: name.trim(), order: insertAt, initialScore } }),
  ])
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
