'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

type AppDialogProps = {
  open: boolean
  title: string
  description?: string
  children: React.ReactNode
  onClose: () => void
}

export function AppDialog({ open, title, description, children, onClose }: AppDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previouslyFocused = document.activeElement as HTMLElement | null
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.requestAnimationFrame(() => {
      dialogRef.current?.focus()
      dialogRef.current?.querySelector<HTMLElement>('.dialog-body')?.scrollTo({ top: 0 })
    })

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section ref={dialogRef} className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1}>
        <header>
          <div>
            <h2 id="dialog-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            className="dialog-close"
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onClose()
            }}
            aria-label="إغلاق النافذة"
          >
            <X />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  )
}
