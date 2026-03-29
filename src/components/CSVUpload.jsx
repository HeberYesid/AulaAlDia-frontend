import { useState } from 'react'
import { api } from '../api/axios'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export default function CSVUpload({ label, uploadUrl, onComplete }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post(uploadUrl, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessage('Carga realizada con éxito')
      onComplete && onComplete(data)
    } catch (err) {
      setMessage(getApiErrorMessage(err, {
        action: 'cargar el archivo CSV',
        fallback: 'No se pudo cargar el archivo CSV. Verifica el formato de columnas y vuelve a intentarlo.',
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <label htmlFor="csv-file-input">{label}</label>
      <input id="csv-file-input" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0])} />
      <div className="form-actions">
        <button className="btn" disabled={!file || loading}>{loading ? 'Cargando...' : 'Subir CSV'}</button>
        {message && <span className="notice" role="status" aria-live="polite" aria-atomic="true">{message}</span>}
      </div>
    </form>
  )
}
