import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'
import TurnstileCaptcha from '../components/TurnstileCaptcha'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export default function ForgotPassword() {
  const captchaRef = useRef(null)
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad.')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/v1/auth/forgot-password/', {
        email,
        turnstile_token: turnstileToken,
      })
      setSuccess(true)
    } catch (err) {
      console.error('Error:', err)
      const turnstileError = err.response?.data?.turnstile_token
      setError(turnstileError || getApiErrorMessage(err, {
        action: 'enviar el codigo de recuperacion',
        fallback: 'No se pudo enviar el codigo de recuperacion. Verifica el correo e intentalo nuevamente.',
      }))
      setTurnstileToken('')
      captchaRef.current?.reset?.()
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2>Código Enviado</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
              Si el email existe en nuestro sistema, recibirás un código de verificación de 6 dígitos.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Revisa tu bandeja de entrada y utiliza el código para restablecer tu contraseña.
            </p>
            <Link 
              to="/reset-password" 
              state={{ email }} 
              className="btn primary"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              Ingresar Código
            </Link>
            <Link 
              to="/login" 
              className="btn secondary"
              style={{ width: '100%' }}
            >
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
          <h2>¿Olvidaste tu Contraseña?</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            No te preocupes, te enviaremos un código de verificación para recuperarla
          </p>
        </div>

        {error && (
          <div className="alert error" role="alert" aria-live="assertive" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
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

          <button 
            type="submit" 
            className="btn primary"
            disabled={loading || !isCaptchaReady || !turnstileToken}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Enviando...' : !isCaptchaReady ? 'Cargando captcha...' : !turnstileToken ? 'Completa el captcha' : 'Enviar Código'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--primary)' }}>
              ← Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
