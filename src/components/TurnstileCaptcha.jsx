import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

const TurnstileCaptcha = forwardRef(({ onVerify, onError, onExpire, onReady, theme = 'light', size = 'normal' }, ref) => {
  const turnstileRef = useRef(null)
  const [widgetId, setWidgetId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  
  // Store callbacks in refs to prevent re-renders from unmounting the widget
  const onVerifyRef = useRef(onVerify)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)
  const onReadyRef = useRef(onReady)
  
  // Update refs when callbacks change
  useEffect(() => {
    onVerifyRef.current = onVerify
    onErrorRef.current = onError
    onExpireRef.current = onExpire
    onReadyRef.current = onReady
  }, [onVerify, onError, onExpire, onReady])

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
            if (onVerifyRef.current) onVerifyRef.current(token)
          },
          'error-callback': (error) => {
            console.error('Turnstile error:', error)
            if (onErrorRef.current) onErrorRef.current(error)
            setIsRendered(false)
          },
          'expired-callback': () => {
            if (onExpireRef.current) onExpireRef.current()
            setIsRendered(false)
          },
          theme: theme,
          size: size
        })
        setWidgetId(id)
        setIsRendered(true)
        if (onReadyRef.current) onReadyRef.current()
      } catch (error) {
        console.error('Error rendering Turnstile:', error)
        if (onErrorRef.current) onErrorRef.current(error)
      }
    }
  }, [isLoaded, widgetId, theme, size])
  
  // Cleanup widget on unmount
  useEffect(() => {
    return () => {
      if (widgetId !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId)
        } catch (error) {
          console.error('Error removing Turnstile widget:', error)
        }
      }
    }
  }, [widgetId])

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
  useImperativeHandle(ref, () => ({
    reset,
    getResponse
  }), [widgetId])

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
})

TurnstileCaptcha.displayName = 'TurnstileCaptcha'

export default TurnstileCaptcha
