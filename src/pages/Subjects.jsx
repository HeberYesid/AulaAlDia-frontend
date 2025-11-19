import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'

export default function Subjects() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    const { data } = await api.get('/api/courses/subjects/')
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/api/courses/subjects/', { name, code })
      setName('')
      setCode('')
      setSuccess('✅ Materia creada exitosamente')
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('❌ No se pudo crear la materia. Verifica que el código sea único.')
    }
  }

  async function deleteSubject(subject) {
    // Confirmación
    const confirmMessage = `¿Estás seguro de que deseas eliminar la materia "${subject.name}" (${subject.code})?\n\nEsta acción eliminará:\n- Todos los estudiantes inscritos\n- Todos los ejercicios\n- Todos los resultados\n\nEsta acción NO se puede deshacer.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/courses/subjects/${subject.id}/`)
      setSuccess(`✅ Materia "${subject.name}" eliminada exitosamente`)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting subject:', err)
      setError(`❌ No se pudo eliminar la materia: ${err.response?.data?.detail || err.message}`)
    }
  }

  return (
    <div>
      {/* Mensajes de éxito/error */}
      {success && (
        <div className="alert success" style={{ marginBottom: 'var(--space-lg)' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="alert error" style={{ marginBottom: 'var(--space-lg)' }}>
          {error}
        </div>
      )}

      <div className="grid cols-2 grid-stack-mobile">
        <div className="card">
          <h2>📝 Crear materia</h2>
          <form onSubmit={createSubject}>
            <div>
              <label>Código</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Ej: PW-2024" />
            </div>
            <div>
              <label>Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Programación Web" />
            </div>
            <button className="btn" type="submit">✅ Crear Materia</button>
          </form>
        </div>
        <div className="card">
          <h2>📚 Mis materias</h2>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '3rem', margin: 0 }}>📭</p>
              <p>No tienes materias creadas</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table mobile-card-view">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Código"><strong>{s.code}</strong></td>
                      <td data-label="Nombre">{s.name}</td>
                      <td data-label="Acciones">
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                          <Link 
                            className="btn secondary" 
                            to={`/subjects/${s.id}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            👁️ Ver
                          </Link>
                          <button
                            onClick={() => deleteSubject(s)}
                            className="btn danger"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
