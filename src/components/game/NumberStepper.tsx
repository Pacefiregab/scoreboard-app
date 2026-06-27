'use client'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  error?: boolean
}

export function NumberStepper({ value, onChange, min = 0, max, error }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="h-12 w-12 rounded-xl border text-xl font-medium flex items-center justify-center disabled:opacity-30 active:bg-muted transition-colors select-none touch-manipulation"
      >
        −
      </button>
      <span className={`w-10 text-center text-lg font-semibold tabular-nums ${error ? 'text-destructive' : ''}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={max !== undefined && value >= max}
        className="h-12 w-12 rounded-xl border text-xl font-medium flex items-center justify-center disabled:opacity-30 active:bg-muted transition-colors select-none touch-manipulation"
      >
        +
      </button>
    </div>
  )
}
