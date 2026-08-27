'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { GameState } from '@/types/game'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Categorical series colours: they encode identity, so they stay fixed rather
// than following the theme, and are mid-toned to read on light and dark alike.
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f97316', // orange
  '#a855f7', // purple
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#ec4899', // pink
]

interface Props {
  game: GameState
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number
  color?: string
}

/**
 * Themed tooltip, ranked best to worst so the standings read at a glance.
 *
 * Hoisted out of ScoreChart: declaring it inline would create a new component
 * type on every render, remounting the tooltip on each mouse move.
 */
function ChartTooltip({
  active,
  payload,
  label,
  nameOf,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  nameOf?: (playerId: string) => string
}) {
  if (!active || !payload?.length) return null

  const rows = payload
    .filter((entry) => typeof entry.value === 'number')
    .sort((a, b) => (b.value as number) - (a.value as number))

  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <div className="space-y-0.5">
        {rows.map((entry) => {
          const key = String(entry.dataKey)
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="flex-1 truncate">{nameOf ? nameOf(key) : key}</span>
              <span className="font-mono font-medium">{entry.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ScoreChart({ game }: Props) {
  const [focused, setFocused] = useState<string | null>(null)

  const doneRounds = game.rounds.filter((r) => r.status === 'DONE')
  if (doneRounds.length === 0) return null

  const sortedPlayers = [...game.players].sort((a, b) => a.order - b.order)
  const colorOf = (playerId: string) =>
    COLORS[sortedPlayers.findIndex((p) => p.id === playerId) % COLORS.length]!
  const nameOf = (playerId: string) =>
    sortedPlayers.find((p) => p.id === playerId)?.name ?? playerId

  const shownPlayers = focused
    ? sortedPlayers.filter((p) => p.id === focused)
    : sortedPlayers

  // One data point per checkpoint: start + after each done round
  const data = [
    {
      label: 'Départ',
      ...Object.fromEntries(sortedPlayers.map((p) => [p.id, p.initialScore])),
    },
    ...doneRounds.map((round) => ({
      label: `M${round.number}`,
      ...Object.fromEntries(
        sortedPlayers.map((p) => {
          const score = round.scores.find((s) => s.playerId === p.id)
          return [p.id, score?.totalPoints ?? null]
        }),
      ),
    })),
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Progression des scores</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pl-0 pr-2">
        {/* Doubles as legend and selector: tap a name to isolate that player */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          <button
            onClick={() => setFocused(null)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              focused === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Tous
          </button>
          {sortedPlayers.map((player) => {
            const isFocused = focused === player.id
            return (
              <button
                key={player.id}
                onClick={() => setFocused(isFocused ? null : player.id)}
                aria-pressed={isFocused}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isFocused
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: colorOf(player.id) }}
                />
                {player.name}
              </button>
            )
          })}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<ChartTooltip nameOf={nameOf} />} cursor={{ strokeOpacity: 0.2 }} />
            {shownPlayers.map((player) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={player.id}
                stroke={colorOf(player.id)}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: colorOf(player.id) }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
