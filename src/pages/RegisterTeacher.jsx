import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import TurnstileCaptcha from './TurnstileCaptcha'

export default function RegisterTeacher() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const captchaRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
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
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('🔒 Las contraseñas no coinciden. Por favor verifica.')
      setIsLoading(false)
      return
    }
    
    try {
      await api.post('/api/auth/register-teacher/', { 
        email, 
        password, 
        first_name: firstName, 
        last_name: lastName,
        invitation_code: invitationCode,
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
      console.error('Error en registro de profesor:', err)
      const errorData = err.response?.data
      
      // Manejar errores específicos por campo
      let errorMessage = 'No se pudo registrar. Verifica los datos.'
      
      if (errorData?.invitation_code) {
        errorMessage = '🎟️ ' + (errorData.invitation_code[0] || errorData.invitation_code)
      } else if (errorData?.email) {
        const emailError = errorData.email[0] || errorData.email
        errorMessage = emailError
        
        // Normalizar mensajes de email duplicado
        if (emailError.toLowerCase().includes('already exists') || 
            emailError.toLowerCase().includes('unique')) {
          errorMessage = '📧 Este correo electrónico ya está registrado. ¿Olvidaste tu contraseña?'
        } else {
          errorMessage = '📧 ' + emailError
        }
      } else if (errorData?.password) {
        const passwordError = Array.isArray(errorData.password) 
          ? errorData.password.join(' ') 
          : errorData.password
        errorMessage = '🔒 ' + passwordError
      } else if (errorData?.non_field_errors) {
        errorMessage = errorData.non_field_errors[0] || errorData.non_field_errors
      } else if (errorData?.detail) {
        errorMessage = errorData.detail
      }
      
      setError(errorMessage)
      
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
          <h1><span className="auth-icon">👨‍🏫</span> Registro de Profesor</h1>
          <p>Regístrate con tu código de invitación</p>
        </div>
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label>🎟️ Código de Invitación</label>
            <input 
              value={invitationCode} 
              onChange={(e) => setInvitationCode(e.target.value)} 
              type="text"
              placeholder="Código recibido por email"
              required
              style={{
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Ingresa el código de invitación que recibiste por correo
            </small>
          </div>

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
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Debe coincidir con el email asociado al código de invitación
            </small>
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
            <label>🔒 Confirmar Contraseña</label>
            <input 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              type="password"
              placeholder="Ingresa la contraseña nuevamente"
              minLength={8}
              required 
            />
            {confirmPassword && password !== confirmPassword && (
              <small style={{ color: 'var(--danger)', fontSize: 'var(--font-size-xs)' }}>
                ❌ Las contraseñas no coinciden
              </small>
            )}
            {confirmPassword && password === confirmPassword && (
              <small style={{ color: 'var(--success)', fontSize: 'var(--font-size-xs)' }}>
                ✅ Las contraseñas coinciden
              </small>
            )}
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
              <>🚀 Registrarme como Profesor</>
            )}
          </button>
          
          {message && (
            <div className="alert success">
              ✅ {message}
            </div>
          )}
          
          {error && (
            <div className="alert error">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>❌ {error}</div>
                {error.includes('ya está registrado') && (
                  <div style={{ fontSize: '0.9rem' }}>
                    <Link to="/forgot-password" className="link" style={{ color: 'white', textDecoration: 'underline' }}>
                      → Recuperar contraseña
                    </Link>
                    {' o '}
                    <Link to="/login" className="link" style={{ color: 'white', textDecoration: 'underline' }}>
                      → Iniciar sesión
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
        
        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión aquí</Link>
          </p>
          <p>
            ¿Eres estudiante? <Link to="/register" className="link">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
