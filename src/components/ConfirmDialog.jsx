import { useEffect, useId, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Accessible confirmation dialog (replaces window.confirm).
 * Implements focus trap, Escape to cancel, and ARIA alertdialog pattern.
 */
export default function ConfirmDialog({ title = '¿Confirmar acción?', message, onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

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
      className="confirm-dialog-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        className="card confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="confirm-dialog__title">{title}</h2>
        <p id={descriptionId} className="confirm-dialog__description">
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button className="btn secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn danger" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}
