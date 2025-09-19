import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import TurnstileCaptcha from './TurnstileCaptcha'

export default function Register() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    
    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad.')
      return
    }
    
    try {
      await register({ 
        email, 
        password, 
        first_name: firstName, 
        last_name: lastName,
        turnstile_token: turnstileToken
      })
      setMessage('Registro exitoso. Revisa tu correo y verifica tu cuenta.')
    } catch (err) {
      setError('No se pudo registrar. Verifica los datos.')
      setTurnstileToken('') // Reset captcha on error
    }
  }

  return (
    <div className="card">
      <h2>Registrarse</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Correo</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required />
        </div>
        <div>
          <label>Nombres</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" />
        </div>
        <div>
          <label>Apellidos</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} type="text" />
        </div>
        <div>
          <TurnstileCaptcha 
            onVerify={setTurnstileToken}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
          />
        </div>
        <button className="btn" type="submit">Crear cuenta</button>
        {message && <p className="notice">{message}</p>}
        {error && <p className="notice">{error}</p>}
      </form>
    </div>
  )
}
