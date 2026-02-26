import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import TurnstileCaptcha from '../components/TurnstileCaptcha'

export default function RegisterTutor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const captchaRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.')
      setIsLoading(false)
      return
    }

    try {
      await api.post('/api/v1/auth/register-tutor/', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        invitation_code: invitationCode,
        turnstile_token: turnstileToken,
      })

      navigate('/verify-code', {
        state: {
          email,
          message: 'Registro de padre/tutor exitoso. Hemos enviado un código de verificación a tu correo.',
        },
      })
    } catch (err) {
      const errorData = err.response?.data
      let errorMessage = 'No se pudo registrar. Verifica los datos.'

      if (errorData?.invitation_code) {
        errorMessage = errorData.invitation_code[0] || errorData.invitation_code
      } else if (errorData?.email) {
        errorMessage = errorData.email[0] || errorData.email
      } else if (errorData?.password) {
        errorMessage = Array.isArray(errorData.password) ? errorData.password.join(' ') : errorData.password
      } else if (errorData?.detail) {
        errorMessage = errorData.detail
      }

      setError(errorMessage)
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
          <h1><span className="auth-icon">👨‍👩‍👧‍👦</span> Registro de Padre/Tutor</h1>
          <p>Regístrate con tu código de invitación</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="invitation-code">Código de Invitación</label>
            <input
              id="invitation-code"
              value={invitationCode}
              onChange={(event) => setInvitationCode(event.target.value)}
              type="text"
              placeholder="Código recibido por email"
              required
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}
            />
          </div>

          <div className="grid cols-2">
            <div className="form-group">
              <label htmlFor="first-name">Nombres</label>
              <input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} type="text" required />
            </div>
            <div className="form-group">
              <label htmlFor="last-name">Apellidos</label>
              <input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} type="text" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showConfirmPassword ? 'text' : 'password'}
                minLength={8}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
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

          <button className="btn auth-btn" type="submit" disabled={isLoading || !isCaptchaReady || !turnstileToken}>
            {isLoading ? 'Creando cuenta...' : 'Registrarme como Padre/Tutor'}
          </button>

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión aquí</Link></p>
          <p>¿Eres profesor? <Link to="/register-teacher" className="link">Regístrate aquí</Link></p>
        </div>
      </div>
    </div>
  )
}
