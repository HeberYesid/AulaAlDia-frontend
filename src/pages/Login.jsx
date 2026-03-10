import { useState, useEffect } from 'react'
import { useAuth } from '../state/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { setApiActiveTenantId } from '../api/axios'

export default function Login() {
  const { login, googleLogin, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showVerifyLink, setShowVerifyLink] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const tenantIdFromQuery = new URLSearchParams(location.search).get('tenant_id')?.trim() || null
  const authQuerySuffix = tenantIdFromQuery ? `?tenant_id=${encodeURIComponent(tenantIdFromQuery)}` : ''

  useEffect(() => {
    if (!tenantIdFromQuery) return

    setApiActiveTenantId(tenantIdFromQuery)
  }, [tenantIdFromQuery])

  function getPostLoginPath() {
    try {
      const raw = localStorage.getItem('auth')
      if (!raw) return from
      const auth = JSON.parse(raw)
      return auth?.user?.role === 'ADMIN' ? '/admin/dashboard' : from
    } catch {
      return from
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true)
      const data = await googleLogin(credentialResponse.credential)
      if (data?.is_new_user) {
        // New users can optionally upgrade their role (Teacher/Tutor) on the next page
        navigate(`/complete-registration${authQuerySuffix}`)
      } else {
        navigate(getPostLoginPath())
      }
    } catch (err) {
      console.error('Google Login Error:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Error al iniciar sesión con Google'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Error al iniciar sesión con Google')
  }

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate(getPostLoginPath())
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Error al iniciar sesión'
      setError(errorMessage)

      if (errorMessage.includes('verificar tu correo')) {
        setShowVerifyLink(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1><span className="auth-icon"></span> Iniciar Sesión</h1>
          <p>Accede a tu cuenta de AulaAlDía</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Correo Electrónico</label>
            <input
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password">Contraseña</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.85rem', color: 'var(--primary)' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ paddingRight: '2.5rem' }}
                autoComplete="current-password"
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
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            className="btn auth-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" aria-hidden="true"></div>
                Iniciando sesión...
              </>
            ) : (
              <>Entrar</>
            )}
          </button>

          {message && (
            <div className="alert success" role="status" aria-live="polite">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="alert error" role="alert" aria-live="assertive">
              ❌ {error}
              {showVerifyLink && (
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <Link
                    to="/verify-code"
                    state={{ email }}
                    className="link"
                  >
                    📧 Verificar mi correo con código
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>O</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <div className="google-login-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_blue"
            shape="pill"
            text="signin_with"
            locale="es"
            width="250"
          />
        </div>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta? <Link to={`/register${authQuerySuffix}`} className="link">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
