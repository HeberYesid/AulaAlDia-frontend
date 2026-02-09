import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/axios'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/v1/auth/reset-password/', {
        email,
        code,
        new_password: newPassword
      })
      
      // Mostrar éxito y redirigir a login
      alert('✅ Contraseña restablecida exitosamente. Ya puedes iniciar sesión.')
      navigate('/login')
    } catch (err) {
      console.error('Error:', err)
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔑</div>
          <h2>Restablecer Contraseña</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Ingresa el código que enviamos a tu email
          </p>
        </div>

        {error && (
          <div className="alert error" style={{ marginBottom: '1rem' }}>
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
            <label htmlFor="code">Código de Verificación (6 dígitos)</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
              disabled={loading}
              maxLength={6}
              style={{ 
                fontSize: '1.5rem', 
                textAlign: 'center',
                letterSpacing: '0.5rem',
                fontWeight: '600'
              }}
            />
            <small style={{ color: 'var(--text-secondary)' }}>
              Revisa tu email. El código es válido por 15 minutos.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <button 
            type="submit" 
            className="btn primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary)', marginRight: '1rem' }}>
              Solicitar nuevo código
            </Link>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <Link to="/login" style={{ color: 'var(--primary)', marginLeft: '1rem' }}>
              Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
