import { Tooltip } from '@/components/ui/tooltip'

interface Props {
  /** Placement of the explanatory tooltip. */
  side?: 'top' | 'bottom'
}

/** Marks a player whose ×2 bonus is armed on the round being shown. */
export function BonusX2Badge({ side = 'top' }: Props) {
  return (
    <Tooltip side={side} label="Bonus ×2 : points de cette manche doublés, gain comme perte">
      <span className="shrink-0 rounded border border-primary/40 bg-primary/10 px-1 text-[10px] font-bold leading-4 text-foreground">
        ×2
      </span>
    </Tooltip>
  )
}
