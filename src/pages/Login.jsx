import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../state/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import TurnstileCaptcha from './TurnstileCaptcha'

export default function Login() {
  const { login, user } = useAuth()
  const captchaRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showVerifyLink, setShowVerifyLink] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // Mostrar mensaje si viene del registro o verificación
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad.')
      setIsLoading(false)
      return
    }
    
    try {
      await login(email, password, turnstileToken)
      navigate(from)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Error al iniciar sesión'
      setError(errorMessage)
      
      // Mostrar enlace de verificación si el error es sobre email no verificado
      if (errorMessage.includes('verificar tu correo')) {
        setShowVerifyLink(true)
      }
      
      // Reset captcha on error
      setTurnstileToken('')
      if (captchaRef.current?.reset) {
        captchaRef.current.reset()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1><span className="auth-icon">🔐</span> Iniciar Sesión</h1>
          <p>Accede a tu cuenta de DevTrack</p>
        </div>
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label>📧 Correo Electrónico</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              placeholder="tu@email.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>🔒 Contraseña</label>
              <Link 
                to="/forgot-password" 
                style={{ fontSize: '0.85rem', color: 'var(--primary)' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <div className="form-group">
            <TurnstileCaptcha
              ref={captchaRef}
              onVerify={setTurnstileToken}
              onError={() => {
                setTurnstileToken('')
                setIsCaptchaReady(false)
              }}
              onExpire={() => {
                setTurnstileToken('')
                setIsCaptchaReady(false)
              }}
              onReady={() => setIsCaptchaReady(true)}
            />
          </div>
          
          {!isCaptchaReady && (
            <div style={{ 
              padding: 'var(--space-sm)', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              ⏳ Esperando verificación de seguridad...
            </div>
          )}
          
          <button 
            className="btn auth-btn" 
            type="submit" 
            disabled={isLoading || !isCaptchaReady || !turnstileToken}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Iniciando sesión...
              </>
            ) : !isCaptchaReady ? (
              <>⏳ Cargando...</>
            ) : !turnstileToken ? (
              <>🔒 Completa el captcha</>
            ) : (
              <>🚀 Entrar</>
            )}
          </button>
          
          {message && (
            <div className="alert success">
              ✅ {message}
            </div>
          )}
          
          {error && (
            <div className="alert error">
              ❌ {error}
              {showVerifyLink && (
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <Link 
                    to="/verify-code" 
                    state={{ email }}
                    className="link"
                  >
                    📧 Verificar mi correo con código
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>
        
        <div className="auth-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register" className="link">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
