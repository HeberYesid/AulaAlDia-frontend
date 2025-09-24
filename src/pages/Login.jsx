import { useState, useEffect } from 'react'
import { useAuth } from '../state/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import TurnstileCaptcha from './TurnstileCaptcha'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showVerifyLink, setShowVerifyLink] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  // Mostrar mensaje si viene del registro o verificación
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
    
    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad.')
      return
    }
    
    try {
      await login(email, password, turnstileToken)
      navigate(from)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Error al iniciar sesión'
      setError(errorMessage)
      
      // Mostrar enlace de verificación si el error es sobre email no verificado
      if (errorMessage.includes('verificar tu correo')) {
        setShowVerifyLink(true)
      }
      
      setTurnstileToken('') // Reset captcha on error
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
        <div>
          <TurnstileCaptcha 
            onVerify={setTurnstileToken}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
          />
        </div>
        <button className="btn" type="submit">Entrar</button>
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            {error}
            {showVerifyLink && (
              <div className="mt-2">
                <Link 
                  to="/verify-code" 
                  state={{ email }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Verificar mi correo con código
                </Link>
              </div>
            )}
          </div>
        )}
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          ¿No tienes cuenta? <Link to="/register" className="text-blue-600 hover:text-blue-800 underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
