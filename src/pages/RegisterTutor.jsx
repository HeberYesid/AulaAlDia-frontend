import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api, setApiActiveTenantId } from '../api/axios'
import TurnstileCaptcha from '../components/TurnstileCaptcha'

export default function RegisterTutor() {
  const { user, activeTenantId } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const captchaRef = useRef(null)

  const searchParams = new URLSearchParams(location.search)
  const tenantIdFromQuery = searchParams.get('tenant_id')?.trim() || null
  const codeFromQuery = searchParams.get('code')?.trim().toUpperCase() || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [invitationCode, setInvitationCode] = useState(codeFromQuery)
  const [invitation, setInvitation] = useState(null)
  const [invitationError, setInvitationError] = useState('')
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(Boolean(codeFromQuery))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const effectiveTenantId = tenantIdFromQuery || invitation?.tenant_id || activeTenantId || null
  const authQuerySuffix = effectiveTenantId ? `?tenant_id=${encodeURIComponent(effectiveTenantId)}` : ''

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!tenantIdFromQuery) return

    setApiActiveTenantId(tenantIdFromQuery)
  }, [tenantIdFromQuery])

  useEffect(() => {
    if (!codeFromQuery) {
      setInvitation(null)
      setInvitationError('')
      setIsLoadingInvitation(false)
      return
    }

    let ignore = false

    async function loadInvitation() {
      setIsLoadingInvitation(true)
      setInvitationError('')

      try {
        const { data } = await api.get(`/api/v1/auth/tutor-invitations/${encodeURIComponent(codeFromQuery)}/`)
        if (ignore) return

        setInvitation(data)
        setEmail(data.email || '')
        if (data.tenant_id) {
          setApiActiveTenantId(data.tenant_id)
        }
      } catch (err) {
        if (ignore) return

        setInvitation(null)
        setInvitationError(err.response?.data?.detail || 'No se pudo validar la invitacion.')
      } finally {
        if (!ignore) {
          setIsLoadingInvitation(false)
        }
      }
    }

    loadInvitation()

    return () => {
      ignore = true
    }
  }, [codeFromQuery])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!invitationCode) {
      setError('Necesitas una invitacion valida para completar este registro.')
      return
    }

    if (!turnstileToken) {
      setError('Por favor completa la verificacion de seguridad.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden. Por favor verifica.')
      return
    }

    setIsLoading(true)
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
          message: 'Registro de acudiente exitoso. Hemos enviado un codigo de verificacion a tu correo.',
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
      captchaRef.current?.reset?.()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container" style={{ minHeight: '100vh', padding: '2rem 1rem', alignItems: 'flex-start' }}>
      <div className="auth-card fade-in" style={{ margin: 'auto' }}>
        <div className="auth-header">
          <h1><span className="auth-icon"></span> Acceso de Acudiente</h1>
          <p>Este registro está disponible solo por invitación asociada a un estudiante.</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {!codeFromQuery && (
            <div className="alert error" role="alert" aria-live="polite">
              Esta página solo habilita altas por invitación. Usa el enlace enviado por el estudiante o ingresa tu código manualmente.
            </div>
          )}

          {isLoadingInvitation && (
            <div className="alert success" role="status" aria-live="polite">
              Validando invitación...
            </div>
          )}

          {invitationError && (
            <div className="alert error" role="alert" aria-live="assertive">
              {invitationError}
            </div>
          )}

          {invitation && (
            <div 
              style={{ 
                marginBottom: 'var(--space-md)', 
                padding: '1rem',
                background: 'var(--bg-secondary)', 
                borderLeft: '4px solid var(--primary-color)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                {invitation.tenant_name}
              </h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Invitación para acompañar a <strong>{invitation.student_name || invitation.student_email}</strong>.
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="invitation-code">Código de Invitación</label>
            <input
              id="invitation-code"
              value={invitationCode}
              onChange={(event) => setInvitationCode(event.target.value.toUpperCase())}
              type="text"
              placeholder="Código recibido por email"
              required
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}
            />
          </div>

          <div className="grid cols-2" style={{ gap: '1rem' }}>
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
            <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" readOnly={Boolean(invitation?.email)} required />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
              Debe coincidir con el correo al que se envió la invitación.
            </small>
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
                style={{ paddingRight: '4.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  padding: '0.2rem'
                }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
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
                style={{ paddingRight: '4.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  padding: '0.2rem'
                }}
              >
                {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
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

          <button className="btn auth-btn" type="submit" disabled={isLoading || isLoadingInvitation || Boolean(invitationError) || !isCaptchaReady || !turnstileToken || !invitationCode}>
            {isLoading ? 'Creando cuenta...' : isLoadingInvitation ? 'Validando invitación...' : invitationError ? 'Invitación no disponible' : 'Completar acceso'}
          </button>

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to={`/login${authQuerySuffix}`} className="link">Inicia sesión aquí</Link></p>
          <p>Si necesitas ayuda con la invitación, contacta al estudiante o a la institución.</p>
        </div>
      </div>
    </div>
  )
}
