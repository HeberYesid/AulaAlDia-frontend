import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Accessible confirmation dialog (replaces window.confirm).
 * Implements focus trap, Escape to cancel, and ARIA alertdialog pattern.
 */
export default function ConfirmDialog({ title = '¿Confirmar acción?', message, onConfirm, onCancel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    // Focus the Cancel button by default (safer for destructive actions)
    const buttons = dialogRef.current?.querySelectorAll('button')
    buttons?.[0]?.focus()
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onCancel()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])]
    if (focusables.length < 2) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '1rem',
      }}
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        ref={dialogRef}
        className="card"
        style={{ maxWidth: '620px', width: '100%', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="confirm-dialog-title" style={{ marginTop: 0, fontSize: '1.1rem' }}>{title}</h2>
        <p
          id="confirm-dialog-desc"
          style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', whiteSpace: 'pre-line' }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn danger" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}
