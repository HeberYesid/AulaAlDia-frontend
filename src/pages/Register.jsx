import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import TurnstileCaptcha from './TurnstileCaptcha'

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const captchaRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)
    
    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad.')
      setIsLoading(false)
      return
    }
    
    try {
      await register({ 
        email, 
        password, 
        first_name: firstName, 
        last_name: lastName,
        turnstile_token: turnstileToken
      })
      
      // Redirigir a la página de verificación por código
      navigate('/verify-code', { 
        state: { 
          email: email,
          message: 'Registro exitoso. Hemos enviado un código de verificación a tu correo.'
        }
      })
    } catch (err) {
      setError('No se pudo registrar. Verifica los datos.')
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
          <h1><span className="auth-icon">📝</span> Crear Cuenta</h1>
          <p>Únete a DevTrack y comienza tu seguimiento académico</p>
        </div>
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="grid cols-2">
            <div className="form-group">
              <label>👤 Nombres</label>
              <input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                type="text"
                placeholder="Tu nombre"
                required 
              />
            </div>
            <div className="form-group">
              <label>👥 Apellidos</label>
              <input 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                type="text"
                placeholder="Tus apellidos"
                required 
              />
            </div>
          </div>
          
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
            <label>🔒 Contraseña</label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required 
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              La contraseña debe tener al menos 8 caracteres
            </small>
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
                Creando cuenta...
              </>
            ) : !isCaptchaReady ? (
              <>⏳ Cargando...</>
            ) : !turnstileToken ? (
              <>🔒 Completa el captcha</>
            ) : (
              <>🚀 Crear Cuenta</>
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
            </div>
          )}
        </form>
        
        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
