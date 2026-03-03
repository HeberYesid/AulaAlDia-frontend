import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import TurnstileCaptcha from '../components/TurnstileCaptcha'

const ROLES = [
  { value: 'STUDENT', label: 'Estudiante' },
  { value: 'TEACHER', label: 'Profesor' },
  { value: 'TUTOR',   label: 'Padre / Tutor' },
]

const ENDPOINTS = {
  STUDENT: '/api/v1/auth/register/',
  TEACHER: '/api/v1/auth/register-teacher/',
  TUTOR:   '/api/v1/auth/register-tutor/',
}

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const captchaRef = useRef(null)

  const [role, setRole] = useState('STUDENT')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const needsInvitation = role === 'TEACHER' || role === 'TUTOR'

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!turnstileToken) {
      setError('Por favor completa la verificacion de seguridad.')
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
        ...(needsInvitation && { invitation_code: invitationCode }),
      }
      await api.post(ENDPOINTS[role], payload)
      navigate('/verify-code', {
        state: {
          email,
          message: 'Registro exitoso. Hemos enviado un codigo de verificacion a tu correo.',
        },
      })
    } catch (err) {
      const d = err.response?.data
      let msg = 'No se pudo registrar. Verifica los datos.'
      if (d?.invitation_code) msg = d.invitation_code[0] ?? d.invitation_code
      else if (d?.email) {
        msg = d.email[0] ?? d.email
        if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique'))
          msg = 'Este correo ya esta registrado. Olvidaste tu contrasena?'
      }
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

        <div className="role-selector">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => { setRole(r.value); setError('') }}
              className={`role-selector-btn ${role === r.value ? 'active' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {needsInvitation && (
            <div className="form-group fade-in">
              <label htmlFor="invitation-code">Codigo de Invitacion</label>
              <input
                id="invitation-code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                type="text"
                placeholder="Codigo recibido por email"
                required={needsInvitation}
                style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                Debe coincidir con el email al que fue enviado el codigo
              </small>
            </div>
          )}

          <div className="grid cols-2">
            <div className="form-group">
              <label htmlFor="reg-first-name">Nombres</label>
              <input
                id="reg-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="Tu nombre"
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

          {!isCaptchaReady && (
            <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Esperando verificacion de seguridad...
            </div>
          )}

          <button
            className="btn auth-btn"
            type="submit"
            disabled={isLoading || !isCaptchaReady || !turnstileToken}
          >
            {isLoading ? (
              <><div className="spinner"></div>Creando cuenta...</>
            ) : !isCaptchaReady ? <>Cargando...</>
            : !turnstileToken ? <>Completa el captcha</>
            : <>Crear Cuenta</>}
          </button>

          {error && (
            <div className="alert error">
              {error}
              {error.includes('ya esta registrado') && (
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  <Link to="/forgot-password" style={{ color: 'white', textDecoration: 'underline' }}>Recuperar contrasena</Link>
                  {' o '}
                  <Link to="/login" style={{ color: 'white', textDecoration: 'underline' }}>Iniciar sesion</Link>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>Ya tienes cuenta? <Link to="/login" className="link">Inicia sesion aqui</Link></p>
        </div>
      </div>
    </div>
  )
}
