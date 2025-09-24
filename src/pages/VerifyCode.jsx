import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/axios'

export default function VerifyCode() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  
  // Obtener email de los parámetros de la URL o del estado de navegación
  useState(() => {
    const params = new URLSearchParams(location.search)
    const emailParam = params.get('email')
    const stateEmail = location.state?.email
    
    if (emailParam) {
      setEmail(emailParam)
    } else if (stateEmail) {
      setEmail(stateEmail)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }
    
    if (!code.trim() || code.length !== 6) {
      setError('Por favor ingresa un código válido de 6 dígitos')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/auth/verify-code/', {
        email: email.trim(),
        code: code.trim()
      })
      
      setMessage(response.data.message)
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Correo verificado exitosamente. Ya puedes iniciar sesión.',
            email: email 
          }
        })
      }, 2000)
      
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0] 
        || err.response?.data?.detail 
        || 'Error al verificar el código'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }

    setResendLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/auth/resend-code/', {
        email: email.trim()
      })
      
      setMessage(response.data.message)
      setCode('') // Limpiar el código anterior
      
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0] 
        || err.response?.data?.detail 
        || err.response?.data?.email?.[0]
        || 'Error al reenviar el código'
      setError(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Solo números
    if (value.length <= 6) {
      setCode(value)
    }
  }

  return (
    <div className="card">
      <h2>Verificar Correo Electrónico</h2>
      <p className="text-gray-600 mb-4">
        Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1">
            Código de Verificación
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={handleCodeChange}
            placeholder="123456"
            className="w-full p-2 border rounded text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength="6"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Ingresa los 6 dígitos que recibiste por email
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verificando...' : 'Verificar Código'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-600 mb-2">
          ¿No recibiste el código?
        </p>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendLoading}
          className="text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendLoading ? 'Reenviando...' : 'Reenviar código'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}
