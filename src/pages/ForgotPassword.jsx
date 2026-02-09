import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/api/v1/auth/forgot-password/', { email })
      setSuccess(true)
    } catch (err) {
      console.error('Error:', err)
      setError(err.response?.data?.detail || 'Error al enviar el código')
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

          <button 
            type="submit" 
            className="btn primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Enviando...' : 'Enviar Código'}
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
