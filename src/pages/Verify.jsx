import { useEffect, useState } from 'react'
import { api } from '../api/axios'

export default function Verify() {
  const [status, setStatus] = useState('Verificando...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      setStatus('Token no provisto')
      return
    }
    async function run() {
      try {
        await api.get(`/api/v1/auth/verify/?token=${encodeURIComponent(token)}`)
        setStatus('Correo verificado exitosamente. Ya puedes iniciar sesión.')
      } catch (err) {
        setStatus('Token inválido o expirado.')
      }
    }
    run()
  }, [])

  return (
    <div className="card">
      <h2>Verificación de correo</h2>
      <p>{status}</p>
    </div>
  )
}
