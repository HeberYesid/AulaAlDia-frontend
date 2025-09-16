import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate(from)
    } catch (err) {
      setError('Credenciales inválidas o correo no verificado.')
    }
  }

  return (
    <div className="card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Correo</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <button className="btn" type="submit">Entrar</button>
        {error && <p className="notice">{error}</p>}
      </form>
      <p className="notice">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
    </div>
  )
}
