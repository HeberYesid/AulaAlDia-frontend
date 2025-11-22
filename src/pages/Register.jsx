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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.')
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
      console.error('Error en registro:', err)
      console.error('Error completo:', err.response?.data)
      
      // Detectar errores específicos del servidor
      let errorMessage = 'No se pudo registrar. Verifica los datos.'
      
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Error de Turnstile (CAPTCHA)
        if (errorData.turnstile_token) {
          if (Array.isArray(errorData.turnstile_token)) {
            errorMessage = '🤖 ' + errorData.turnstile_token[0]
          } else {
            errorMessage = '🤖 ' + errorData.turnstile_token
          }
        }
        // Error de email duplicado
        else if (errorData.email) {
          if (Array.isArray(errorData.email)) {
            errorMessage = errorData.email[0]
          } else {
            errorMessage = errorData.email
          }
          // Normalizar mensajes comunes de email duplicado
          if (errorMessage.toLowerCase().includes('already exists') || 
              errorMessage.toLowerCase().includes('unique')) {
            errorMessage = 'Este correo electrónico ya está registrado. ¿Olvidaste tu contraseña?'
          }
        }
        // Error de username duplicado
        else if (errorData.username) {
          errorMessage = 'Este usuario ya existe.'
        }
        // Error de contraseña débil
        else if (errorData.password) {
          if (Array.isArray(errorData.password)) {
            errorMessage = ' ' + errorData.password.join(' ')
          } else {
            errorMessage = ' ' + errorData.password
          }
        }
        // Error general del servidor
        else if (errorData.detail) {
          errorMessage = errorData.detail
        }
        // Otros errores de campos
        else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors
        }
        // Mostrar todos los errores si no coincide con ningún caso
        else {
          const allErrors = Object.entries(errorData).map(([field, errors]) => {
            const errorMsg = Array.isArray(errors) ? errors[0] : errors
            return `${field}: ${errorMsg}`
          }).join(', ')
          if (allErrors) {
            errorMessage = allErrors
          }
        }
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
          <h1><span className="auth-icon"></span> Crear Cuenta</h1>
        </div>
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="grid cols-2">
            <div className="form-group">
              <label>Nombres</label>
              <input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                type="text"
                placeholder="Tu nombre"
                required 
              />
            </div>
            <div className="form-group">
              <label>Apellidos</label>
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
            <label>Correo Electrónico</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email"
              placeholder="tu@email.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                style={{ paddingRight: '2.5rem' }}
                minLength={8}
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              La contraseña debe tener al menos 8 caracteres
            </small>
          </div>
          
          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ingresa la contraseña nuevamente"
                style={{ paddingRight: '2.5rem' }}
                minLength={8}
                required 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)'
                }}
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <small style={{ color: 'var(--danger)', fontSize: 'var(--font-size-xs)' }}>
                Las contraseñas no coinciden
              </small>
            )}
            {confirmPassword && password === confirmPassword && (
              <small style={{ color: 'var(--success)', fontSize: 'var(--font-size-xs)' }}>
                Las contraseñas coinciden
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
              <>Cargando...</>
            ) : !turnstileToken ? (
              <>Completa el captcha</>
            ) : (
              <>Crear Cuenta</>
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
            ¿Eres profesor? <Link to="/register-teacher" className="link">Regístrate con código de invitación</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
