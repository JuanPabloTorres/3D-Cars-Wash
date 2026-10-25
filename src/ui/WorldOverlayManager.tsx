import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

/** Stable transaction panel. World labels never contain forms. */
export function WorldPanel({
  title,
  subtitle,
  children,
  onClose,
  compact = false,
  onToggle,
  className = '',
  contextKey,
}: {
  title: string
  subtitle: string
  children: ReactNode
  onClose: () => void
  compact?: boolean
  onToggle?: () => void
  className?: string
  contextKey?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null

    return () => {
      requestAnimationFrame(() => {
        // A navigation trigger may be recreated when its panel closes. Wait for that
        // commit, and never steal focus from a replacement dialog opened meanwhile.
        if (document.querySelector('[role="dialog"]')) return

        const prior =
          previous && previous !== document.body && previous.isConnected ? previous : null
        const target =
          prior && !prior.matches('.visit-toggle')
            ? prior
            : document.querySelector<HTMLElement>('.reopen-area') ||
              prior ||
              document.querySelector<HTMLElement>('.visit-toggle')

        target?.focus({ preventScroll: true })
      })
    }
  }, [])
  // Steps share a mounted panel. Focus and reading position must follow the step,
  // while ordinary data refreshes leave the user's reading position untouched.
  useLayoutEffect(() => {
    const panel = ref.current

    panel?.querySelector<HTMLElement>('.panel-heading h2')?.focus({ preventScroll: true })
    panel?.querySelector('.panel-content')?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [contextKey])
  // Animate the existing content node, so step changes never remount forms or lose drafts.
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animation = ref.current?.querySelector('.panel-content')?.animate(
      [
        { opacity: 0, translate: '0 10px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' },
    )

    return () => animation?.cancel()
  }, [contextKey])
  useEffect(() => {
    const viewport = window.visualViewport

    if (!viewport) return

    const update = () => {
      ref.current?.style.setProperty('--usable-height', `${viewport.height}px`)
      ref.current?.style.setProperty(
        '--keyboard-inset',
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      )
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)

    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <section
      className={`world-panel ${compact ? 'compact' : ''} ${className}`}
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose()
          e.stopPropagation()
        }
        if (e.key === 'Tab') {
          const items = Array.from(
            ref.current!.querySelectorAll<HTMLElement>(
              'button:not(:disabled),input:not(:disabled),select,textarea,summary,a[href]',
            ),
          ).filter((el) => el.getClientRects().length)
          const index = items.indexOf(document.activeElement as HTMLElement)

          if (e.shiftKey && index <= 0) {
            e.preventDefault()
            items.at(-1)?.focus()
          } else if (!e.shiftKey && (index === items.length - 1 || index < 0)) {
            e.preventDefault()
            items[0]?.focus()
          }
        }
      }}
    >
      <div className="sheet-grip" aria-hidden="true" />
      <header className="panel-heading">
        <div>
          <small>{subtitle}</small>
          <h2 tabIndex={-1}>{title}</h2>
        </div>
        {onToggle && (
          <button
            className="icon-button"
            onClick={onToggle}
            aria-label={compact ? 'Ampliar detalles' : 'Reducir detalles'}
          >
            {compact ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
        <button className="icon-button" aria-label={`Cerrar ${title}`} onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="panel-content">{children}</div>
    </section>
  )
}
