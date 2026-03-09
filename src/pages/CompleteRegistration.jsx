import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'

/**
 * Optional post-Google-auth step.
 * New users who signed in with Google land here so they can enter an
 * invitation code if they are a Teacher or Caregiver.
 * Students can skip straight to the dashboard.
 */
export default function CompleteRegistration() {
  const { updateUser, user } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('TEACHER')
  const [invitationCode, setInvitationCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpgrade(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const { data } = await api.post('/api/v1/auth/complete-google-registration/', {
        role,
        invitation_code: invitationCode,
      })
      updateUser(data.user)
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
            Si eres Profesor o Acudiente, ingresa tu código de invitación para actualizar tu rol.
          </p>
        </div>

        <form onSubmit={handleUpgrade} className="auth-form">
          <div className="form-group">
            <label>Soy...</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { value: 'TEACHER', label: 'Profesor' },
                { value: 'TUTOR',   label: 'Acudiente' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); setError('') }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid',
                    borderColor: role === r.value ? 'var(--primary)' : 'var(--border-color)',
                    background: role === r.value ? 'var(--primary)' : 'var(--bg-card)',
                    color: role === r.value ? '#fff' : 'var(--text-primary)',
                    fontWeight: role === r.value ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    transition: 'all 0.15s',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="invitation-code">Código de Invitación</label>
            <input
              id="invitation-code"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              type="text"
              placeholder="Código recibido por email"
              required
              style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              El código debe coincidir con tu dirección de email de Google
            </small>
          </div>

          {error && (
            <div className="alert error">❌ {error}</div>
          )}

          <button
            className="btn auth-btn"
            type="submit"
            disabled={isLoading || !invitationCode}
          >
            {isLoading ? (
              <><div className="spinner"></div>Actualizando rol...</>
            ) : (
              <>Confirmar y continuar</>
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
