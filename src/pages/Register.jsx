import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api, setApiActiveTenantId } from '../api/axios'
import TurnstileCaptcha from '../components/TurnstileCaptcha'
import LegalConsentField from '../components/LegalConsentField'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const captchaRef = useRef(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [legalAcceptance, setLegalAcceptance] = useState(false)
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const tenantIdFromQuery = new URLSearchParams(location.search).get('tenant_id')?.trim() || null
  const authQuerySuffix = tenantIdFromQuery ? `?tenant_id=${encodeURIComponent(tenantIdFromQuery)}` : ''

  const shouldShowRegistrationForm = Boolean(tenantIdFromQuery)

  useEffect(() => {
    if (!tenantIdFromQuery) return

    setApiActiveTenantId(tenantIdFromQuery)
  }, [tenantIdFromQuery])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!shouldShowRegistrationForm) {
      setError('Debes iniciar el registro desde el portal de una institución activa.')
      return
    }

    if (!turnstileToken) {
      setError('Por favor completa la verificacion de seguridad.')
      return
    }
    if (!legalAcceptance) {
      setError('Debes aceptar el tratamiento de datos y los terminos legales para continuar.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        turnstile_token: turnstileToken,
        legal_acceptance: legalAcceptance,
      }
      await api.post('/api/v1/auth/register/', payload)
      navigate('/verify-code', {
        state: {
          email,
          message: 'Registro exitoso. Hemos enviado un codigo de verificacion a tu correo.',
        },
      })
    } catch (err) {
      const d = err.response?.data
      let msg = getApiErrorMessage(err, {
        action: 'completar el registro de tu cuenta',
        fallback: 'No se pudo completar el registro de tu cuenta. Revisa los datos e intentalo nuevamente.',
      })
      if (d?.email) {
        msg = d.email[0] ?? d.email
        if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique'))
          msg = 'Este correo ya esta registrado. Olvidaste tu contrasena?'
      }
      else if (d?.tenant) msg = Array.isArray(d.tenant) ? d.tenant[0] : d.tenant
      else if (d?.password) msg = Array.isArray(d.password) ? d.password.join(' ') : d.password
      else if (d?.turnstile_token) msg = Array.isArray(d.turnstile_token) ? d.turnstile_token[0] : d.turnstile_token
      else if (d?.detail) msg = d.detail
      else if (d?.non_field_errors) msg = Array.isArray(d.non_field_errors) ? d.non_field_errors[0] : d.non_field_errors
      setError(msg)
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
          <h1><span className="auth-icon"></span> Crear Cuenta</h1>
        </div>

        {!shouldShowRegistrationForm ? (
          <div className="alert success" role="status" aria-live="polite">
            Para crear tu cuenta debes ingresar desde el enlace de registro compartido por tu institución.
          </div>
        ) : (
          <>
            <div className="alert success" role="status" aria-live="polite">
              Estás creando tu cuenta como estudiante.
            </div>

            <form onSubmit={onSubmit} className="auth-form">

              <div className="grid cols-2">
                <div className="form-group">
                  <label htmlFor="reg-first-name">Nombres</label>
                  <input
                    id="reg-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    type="text"
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-last-name">Apellidos</label>
                  <input
                    id="reg-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    type="text"
                    placeholder="Tus apellidos"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Correo Electronico</label>
                <input
                  id="reg-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Contrasena</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimo 8 caracteres"
                    style={{ paddingRight: '2.5rem' }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm-password">Confirmar Contrasena</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ingresa la contrasena nuevamente"
                    style={{ paddingRight: '2.5rem' }}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    aria-label={showConfirmPassword ? 'Ocultar confirmacion' : 'Mostrar confirmacion'}
                  >
                    {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {confirmPassword && (
                  <small style={{ color: password === confirmPassword ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--font-size-xs)' }}>
                    {password === confirmPassword ? 'Las contrasenas coinciden' : 'Las contrasenas no coinciden'}
                  </small>
                )}
              </div>

              <div className="form-group">
                <TurnstileCaptcha
                  ref={captchaRef}
                  onVerify={setTurnstileToken}
                  onError={() => { setTurnstileToken(''); setIsCaptchaReady(false) }}
                  onExpire={() => { setTurnstileToken(''); setIsCaptchaReady(false) }}
                  onReady={() => setIsCaptchaReady(true)}
                />
              </div>

              <LegalConsentField
                id="register-legal-consent"
                checked={legalAcceptance}
                onChange={setLegalAcceptance}
                disabled={isLoading}
                contextLabel="Autorizo el tratamiento de mis datos personales para crear y administrar mi cuenta en AulaAlDia."
              />

              {!isCaptchaReady && (
                <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Esperando verificacion de seguridad...
                </div>
              )}

              <button
                className="btn auth-btn"
                type="submit"
                disabled={isLoading || !isCaptchaReady || !turnstileToken || !legalAcceptance}
              >
                {isLoading ? (
                  <><div className="spinner" aria-hidden="true"></div>Creando cuenta...</>
                ) : !isCaptchaReady ? <>Cargando...</>
                : !turnstileToken ? <>Completa el captcha</>
                : <>Crear Cuenta</>}
              </button>

              {error && (
                <div className="alert error" role="alert" aria-live="assertive">
                  {error}
                  {error.includes('ya esta registrado') && (
                    <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      <Link to="/forgot-password" style={{ color: 'white', textDecoration: 'underline' }}>Recuperar contrasena</Link>
                      {' o '}
                      <Link to={`/login${authQuerySuffix}`} style={{ color: 'white', textDecoration: 'underline' }}>Iniciar sesion</Link>
                    </div>
                  )}
                </div>
              )}
            </form>
          </>
        )}

        <div className="auth-footer">
          <p>Ya tienes cuenta? <Link to={`/login${authQuerySuffix}`} className="link">Inicia sesion aqui</Link></p>
          <p className="auth-legal-links">
            <Link to="/privacy">Privacidad</Link> · <Link to="/terms">Terminos</Link> ·{' '}
            <Link to="/habeas-data">Habeas Data</Link> · <Link to="/pqrs">PQRS</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
