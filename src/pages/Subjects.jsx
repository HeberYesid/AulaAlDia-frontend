import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import HierarchicalSelector from '../components/HierarchicalSelector'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { unwrapListData } from '../utils/pagination'

function normalizeApiError(error, fallback) {
  return getApiErrorMessage(error, {
    action: 'completar la accion en materias',
    fallback,
  })
}

export default function Subjects() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    const { data } = await api.get('/api/v1/courses/subjects/')
    setItems(unwrapListData(data))
  }

  useEffect(() => {
    load()
  }, [])

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/api/v1/courses/subjects/', { name })
      setName('')
      setSuccess('Materia creada exitosamente')
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo crear la materia. Verifica el nombre y tu institucion activa.'
      ))
    }
  }

  async function deleteSubject(subject) {
    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/v1/courses/subjects/${subject.id}/`)
      setSuccess(`Materia "${subject.name}" eliminada exitosamente`)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting subject:', err)
      const errorMessage = getApiErrorMessage(err, {
        action: `eliminar la materia ${subject.name}`,
        fallback: 'No se pudo eliminar la materia. Puede tener registros relacionados o permisos restringidos.',
      })
      setError(errorMessage)
    }
  }

  function handleDeleteClick(subject) {
    setConfirmDelete(subject)
  }

  function handleConfirmDelete() {
    const subject = confirmDelete
    setConfirmDelete(null)
    deleteSubject(subject)
  }

  return (
    <div>
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar materia?"
          message={`¿Estás seguro de que deseas eliminar la materia "${confirmDelete.name}"? Esta acción eliminará todos los estudiantes inscritos, ejercicios y resultados. Esta acción NO se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {/* Mensajes de éxito/error */}
      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      {/* Fase 4: Selector Jerárquico para navegación académica */}
      <HierarchicalSelector 
        onSelectSubject={(subject) => {
          if (subject) {
            // Optional: Podríamos navegar a la materia o filtrarla aquí. 
            // Por ahora, dejamos que sea un selector de demostración que 
            // podría reemplazar la vista en un futuro.
          }
        }} 
      />

      <div className="grid cols-2 grid-stack-mobile">
        <div className="card">
          <h2>Crear materia</h2>
          <form onSubmit={createSubject}>
            <div>
              <label htmlFor="subject-name">Nombre</label>
              <input id="subject-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Matemáticas" />
            </div>
            <button className="btn" type="submit">Crear Materia</button>
          </form>
        </div>
        <div className="card">
          <h2>Mis materias</h2>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '3rem', margin: 0 }}></p>
              <p>No tienes materias creadas</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table mobile-card-view">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Nombre">{s.name}</td>
                      <td data-label="Acciones">
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                          <Link 
                            className="btn secondary" 
                            to={`/subjects/${s.id}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(s)}
                            className="btn danger"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Eliminar
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
