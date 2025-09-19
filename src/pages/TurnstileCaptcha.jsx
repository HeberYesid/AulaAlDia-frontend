import { useEffect, useRef, useState } from 'react'

export default function TurnstileCaptcha({ onVerify, onError, onExpire, theme = 'light', size = 'normal' }) {
  const turnstileRef = useRef(null)
  const [widgetId, setWidgetId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      setIsLoaded(true)
      return
    }

    // Wait for script to load if it's being loaded
    const checkTurnstile = setInterval(() => {
      if (window.turnstile) {
        setIsLoaded(true)
        clearInterval(checkTurnstile)
      }
    }, 100)

    return () => clearInterval(checkTurnstile)
  }, [])

  useEffect(() => {
    if (isLoaded && turnstileRef.current && !widgetId) {
      try {
        const id = window.turnstile.render(turnstileRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAB195XyO5y089iC-',
          callback: (token) => {
            if (onVerify) onVerify(token)
          },
          'error-callback': (error) => {
            console.error('Turnstile error:', error)
            if (onError) onError(error)
          },
          'expired-callback': () => {
            if (onExpire) onExpire()
          },
          theme: theme,
          size: size
        })
        setWidgetId(id)
      } catch (error) {
        console.error('Error rendering Turnstile:', error)
        if (onError) onError(error)
      }
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId)
        } catch (error) {
          console.error('Error removing Turnstile widget:', error)
        }
      }
    }
  }, [isLoaded, widgetId, onVerify, onError, onExpire, theme, size])

  const reset = () => {
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.reset(widgetId)
      } catch (error) {
        console.error('Error resetting Turnstile:', error)
      }
    }
  }

  const getResponse = () => {
    if (widgetId && window.turnstile) {
      try {
        return window.turnstile.getResponse(widgetId)
      } catch (error) {
        console.error('Error getting Turnstile response:', error)
        return null
      }
    }
    return null
  }

  // Expose reset and getResponse methods via ref
  useEffect(() => {
    if (turnstileRef.current) {
      turnstileRef.current.reset = reset
      turnstileRef.current.getResponse = getResponse
    }
  }, [widgetId])

  if (!isLoaded) {
    return (
      <div style={{ 
        width: '300px', 
        height: '65px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        Cargando captcha...
      </div>
    )
  }

  return <div ref={turnstileRef}></div>
}
