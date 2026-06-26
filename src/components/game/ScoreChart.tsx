'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { GameState } from '@/types/game'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

export function ScoreChart({ game }: Props) {
  const doneRounds = game.rounds.filter((r) => r.status === 'DONE')
  if (doneRounds.length === 0) return null

  const sortedPlayers = [...game.players].sort((a, b) => a.order - b.order)

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
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
              }}
              formatter={(value, _key, entry) => {
                const player = sortedPlayers.find((p) => p.id === entry.dataKey)
                return [value, player?.name ?? String(entry.dataKey)]
              }}
            />
            <Legend
              formatter={(value) => {
                const player = sortedPlayers.find((p) => p.id === value)
                return (
                  <span style={{ fontSize: 12 }}>{player?.name ?? value}</span>
                )
              }}
            />
            {sortedPlayers.map((player, index) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={player.id}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
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
