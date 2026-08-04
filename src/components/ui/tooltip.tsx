'use client'

import { cloneElement, useId, useState } from 'react'

type TriggerProps = {
  'aria-describedby'?: string
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
}

interface Props {
  /** Tooltip content. */
  label: React.ReactNode
  /** Side to place the tooltip on. */
  side?: 'top' | 'bottom'
  /** Single element that opens the tooltip on hover or focus. */
  children: React.ReactElement<TriggerProps>
}

/**
 * Themed replacement for the native `title` attribute: styled with the popover
 * tokens so it follows light, dark and rose alike, and shown on focus as well
 * as hover so it stays reachable from the keyboard.
 */
export function Tooltip({ label, side = 'top', children }: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()

  const show = () => setOpen(true)
  const hide = () => setOpen(false)

  const trigger = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e)
      show()
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e)
      hide()
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e)
      show()
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e)
      hide()
    },
  })

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-56 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs font-normal text-popover-foreground shadow-md ${
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
