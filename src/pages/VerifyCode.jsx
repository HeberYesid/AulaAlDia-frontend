import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export default function VerifyCode() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  
  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])
  
  // Obtener email de los parámetros de la URL o del estado de navegación
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const emailParam = params.get('email')
    const stateEmail = location.state?.email
    
    if (emailParam) {
      setEmail(emailParam)
    } else if (stateEmail) {
      setEmail(stateEmail)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }
    
    if (!code.trim() || code.length !== 6) {
      setError('Por favor ingresa un código válido de 6 dígitos')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/v1/auth/verify-code/', {
        email: email.trim(),
        code: code.trim()
      })
      
      setMessage(response.data.message)
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Correo verificado exitosamente. Ya puedes iniciar sesión.',
            email: email 
          }
        })
      }, 2000)
      
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0]
        || getApiErrorMessage(err, {
          action: 'verificar el codigo',
          fallback: 'No se pudo verificar el codigo. Revisa el correo y que el codigo tenga 6 digitos.',
        })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }

    setResendLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/v1/auth/resend-code/', {
        email: email.trim()
      })
      
      setMessage(response.data.message)
      setCode('') // Limpiar el código anterior
      
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.email?.[0]
        || getApiErrorMessage(err, {
          action: 'reenviar el codigo de verificacion',
          fallback: 'No se pudo reenviar el codigo de verificacion. Verifica el correo e intentalo nuevamente.',
        })
      setError(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Solo números
    if (value.length <= 6) {
      setCode(value)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1>📧 Verificar Email</h1>
          <p>Ingresa el código de 6 dígitos que enviamos a tu correo</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="verify-email">Correo Electrónico</label>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="verify-code">Código de Verificación</label>
            <input
              id="verify-code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="123456"
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'monospace',
                letterSpacing: '0.5em',
                fontWeight: 'bold'
              }}
              maxLength="6"
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Ingresa los 6 dígitos que recibiste por email
            </small>
          </div>

          {error && (
            <div className="alert error">
              ❌ {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              ✅ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn auth-btn"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Verificando...
              </>
            ) : (
              <>✅ Verificar Código</>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-lg)' }}>
          <p style={{ marginBottom: 'var(--space-sm)' }}>
            ¿No recibiste el código?
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="link"
            style={{ marginBottom: 'var(--space-md)' }}
          >
            {resendLoading ? '📤 Reenviando...' : '📤 Reenviar código'}
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="link"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
