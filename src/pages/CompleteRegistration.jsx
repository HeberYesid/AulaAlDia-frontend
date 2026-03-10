import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api, setApiActiveTenantId } from '../api/axios'

/**
 * Optional post-Google-auth step.
 * New users who signed in with Google land here so they can complete
 * a restricted teacher or caregiver invitation using a valid code.
 */
export default function CompleteRegistration() {
  const { updateUser, user, activeTenantId } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [invitationCode, setInvitationCode] = useState(new URLSearchParams(location.search).get('code')?.trim().toUpperCase() || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tenantIdFromQuery = new URLSearchParams(location.search).get('tenant_id')?.trim() || null
  const effectiveTenantId = tenantIdFromQuery || activeTenantId || null

  useEffect(() => {
    if (!tenantIdFromQuery) return

    setApiActiveTenantId(tenantIdFromQuery)
  }, [tenantIdFromQuery])

  async function handleUpgrade(e) {
    e.preventDefault()
    setError('')

    if (!invitationCode) {
      setError('Ingresa un codigo de invitacion valido para acceder como profesor o acudiente.')
      return
    }

    setIsLoading(true)
    try {
      const { data } = await api.post('/api/v1/auth/complete-google-registration/', {
        invitation_code: invitationCode,
      })
      updateUser(data.user)
      setSuccess(data.message || 'Registro restringido completado correctamente.')
      navigate('/')
    } catch (err) {
      const d = err.response?.data
      setError(d?.error || d?.detail || 'No se pudo completar el registro.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1><span className="auth-icon"></span> Bienvenido/a{user?.first_name ? `, ${user.first_name}` : ''}!</h1>
          <p>Tu cuenta de Google fue registrada como <strong>Estudiante</strong>.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Si recibiste una invitacion de Profesor o Acudiente, ingresa el codigo para completar ese acceso restringido.
          </p>
        </div>

        <form onSubmit={handleUpgrade} className="auth-form">
          {effectiveTenantId && (
            <div className="alert success" role="status" aria-live="polite">
              Institucion activa detectada para este flujo.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="complete-registration-code">Codigo de Invitacion</label>
            <input
              id="complete-registration-code"
              value={invitationCode}
              onChange={(event) => setInvitationCode(event.target.value.toUpperCase())}
              type="text"
              placeholder="Codigo recibido por email"
              style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              El backend validara el rol y la institucion desde la invitacion, no desde una seleccion libre.
            </small>
          </div>

          {success && (
            <div className="alert success">{success}</div>
          )}

          {error && (
            <div className="alert error">❌ {error}</div>
          )}

          <button
            className="btn auth-btn"
            type="submit"
            disabled={isLoading || !invitationCode}
          >
            {isLoading ? (
              <><div className="spinner"></div>Validando invitacion...</>
            ) : (
              <>Completar acceso restringido</>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link
            to="/"
            style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}
          >
            Continuar como Estudiante →
          </Link>
        </div>
      </div>
    </div>
  )
}
