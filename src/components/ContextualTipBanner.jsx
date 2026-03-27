import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { getContextualTipByPath } from '../utils/navigation'

export default function ContextualTipBanner() {
  const { user } = useAuth()
  const location = useLocation()
  const [isDismissed, setIsDismissed] = useState(false)

  const tip = user ? getContextualTipByPath(user, location.pathname) : null
  const dismissKey = user
    ? `contextual-tip-banner:dismissed:${user.id || user.role || 'unknown'}:${location.pathname}`
    : null

  useEffect(() => {
    if (!dismissKey) {
      setIsDismissed(false)
      return
    }

    try {
      setIsDismissed(window.localStorage.getItem(dismissKey) === '1')
    } catch {
      setIsDismissed(false)
    }
  }, [dismissKey])

  function handleDismiss() {
    if (!dismissKey) return

    try {
      window.localStorage.setItem(dismissKey, '1')
    } catch {
      // Ignore localStorage write failures in private/restricted environments.
    }

    setIsDismissed(true)
  }

  if (!user || !tip || isDismissed) return null

  return (
    <div className="alert info contextual-tip-banner" role="status" aria-live="polite">
      <p className="contextual-tip-banner__message">💡 {tip}</p>
      <button
        type="button"
        className="contextual-tip-banner__dismiss"
        onClick={handleDismiss}
        aria-label="Cerrar tip"
      >
        Cerrar
      </button>
    </div>
  )
}