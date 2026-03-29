import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api, setApiActiveTenantId } from '../api/axios'
import TurnstileCaptcha from '../components/TurnstileCaptcha'
import { APP_CONFIG, VALIDATION_MESSAGES } from '../utils/constants'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export default function RegisterTeacher() {
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
        const { data } = await api.get(`/api/v1/auth/teacher-invitations/${encodeURIComponent(codeFromQuery)}/`)
        if (ignore) return

        setInvitation(data)
        setEmail(data.email || '')
        if (data.tenant_id) {
          setApiActiveTenantId(data.tenant_id)
        }
      } catch (err) {
        if (ignore) return

        setInvitation(null)
        setInvitationError(getApiErrorMessage(err, {
          action: 'validar la invitacion de profesor',
          fallback: 'No se pudo validar la invitacion de profesor. Verifica el codigo e intentalo de nuevo.',
        }))
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
      await api.post('/api/v1/auth/register-teacher/', {
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
          message: 'Registro exitoso. Hemos enviado un codigo de verificacion a tu correo.',
        },
      })
    } catch (err) {
      const errorData = err.response?.data
      let errorMessage = getApiErrorMessage(err, {
        action: 'completar el registro de profesor',
        fallback: 'No se pudo completar el registro de profesor. Revisa los datos e intentalo nuevamente.',
      })

      if (errorData?.invitation_code) {
        errorMessage = errorData.invitation_code[0] || errorData.invitation_code
      } else if (errorData?.email) {
        errorMessage = errorData.email[0] || errorData.email
      } else if (errorData?.password) {
        errorMessage = Array.isArray(errorData.password) ? errorData.password.join(' ') : errorData.password
      } else if (errorData?.non_field_errors) {
        errorMessage = errorData.non_field_errors[0] || errorData.non_field_errors
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
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1><span className="auth-icon"></span> Acceso de Profesor</h1>
          <p>Este registro esta disponible solo por invitacion institucional.</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {!codeFromQuery && (
            <div className="alert error" role="alert" aria-live="polite">
              Esta pagina solo habilita altas por invitacion. Usa el enlace enviado por tu institucion o ingresa tu codigo manualmente.
            </div>
          )}

          {isLoadingInvitation && (
            <div className="alert success" role="status" aria-live="polite">
              Validando invitacion...
            </div>
          )}

          {invitationError && (
            <div className="alert error" role="alert" aria-live="assertive">
              {invitationError}
            </div>
          )}

          {invitation && (
            <div className="card" style={{ marginBottom: 'var(--space-md)', background: 'var(--bg-secondary)' }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{invitation.tenant_name}</p>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                El rol de profesor se asignara automaticamente al completar este formulario.
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="invitation-code">Codigo de Invitacion</label>
            <input
              id="invitation-code"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              type="text"
              placeholder="Código recibido por email"
              required
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Debe coincidir con la invitacion enviada por tu institucion.
            </small>
          </div>

          <div className="grid cols-2">
            <div className="form-group">
              <label htmlFor="first-name">Nombres</label>
              <input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last-name">Apellidos</label>
              <input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder="Tus apellidos"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electronico</label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              readOnly={Boolean(invitation?.email)}
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Debe coincidir con el email asociado al codigo de invitacion.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contrasena</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder={`Minimo ${APP_CONFIG.MIN_PASSWORD_LENGTH} caracteres`}
                style={{ paddingRight: '2.5rem' }}
                minLength={APP_CONFIG.MIN_PASSWORD_LENGTH}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              {VALIDATION_MESSAGES.PASSWORD_TOO_SHORT}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar Contrasena</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ingresa la contrasena nuevamente"
                style={{ paddingRight: '2.5rem' }}
                minLength={APP_CONFIG.MIN_PASSWORD_LENGTH}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
                aria-label={showConfirmPassword ? 'Ocultar confirmacion' : 'Mostrar confirmacion'}
              >
                {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <small style={{ color: 'var(--danger)', fontSize: 'var(--font-size-xs)' }}>
                {VALIDATION_MESSAGES.PASSWORDS_MUST_MATCH}
              </small>
            )}
            {confirmPassword && password === confirmPassword && (
              <small style={{ color: 'var(--success)', fontSize: 'var(--font-size-xs)' }}>
                Las contrasenas coinciden.
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
            disabled={isLoading || isLoadingInvitation || Boolean(invitationError) || !isCaptchaReady || !turnstileToken || !invitationCode}
          >
            {isLoading ? (
              <><div className="spinner"></div>Creando cuenta...</>
            ) : isLoadingInvitation ? (
              <>Validando invitacion...</>
            ) : invitationError ? (
              <>Invitacion no disponible</>
            ) : !isCaptchaReady ? (
              <>Cargando...</>
            ) : !turnstileToken ? (
              <>Completa el captcha</>
            ) : (
              <>Completar acceso de profesor</>
            )}
          </button>

          {message && <div className="alert success">{message}</div>}
          {error && (
            <div className="alert error" role="alert" aria-live="assertive">
              {error}
              {error.includes('registrado') && (
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  <Link to="/forgot-password" className="link" style={{ color: 'white', textDecoration: 'underline' }}>
                    Recuperar contrasena
                  </Link>
                  {' o '}
                  <Link to={`/login${authQuerySuffix}`} className="link" style={{ color: 'white', textDecoration: 'underline' }}>
                    Iniciar sesion
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>Ya tienes cuenta? <Link to={`/login${authQuerySuffix}`} className="link">Inicia sesion aqui</Link></p>
          <p>Si necesitas acceso y no recibiste invitacion, contacta a tu institucion.</p>
        </div>
      </div>
    </div>
  )
}
