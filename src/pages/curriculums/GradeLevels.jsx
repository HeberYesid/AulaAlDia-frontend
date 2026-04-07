import React, { useCallback, useState, useEffect } from 'react'
import { api } from '../../api/axios'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'
import { unwrapListData } from '../../utils/pagination'

const INITIAL_FORM_DATA = { name: '', is_active: true }

export default function GradeLevels() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_DATA }))
  const [submitting, setSubmitting] = useState(false)

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setFormData({ ...INITIAL_FORM_DATA })
  }, [])
  
  useEffect(() => {
    fetchGrades()
  }, [])

  useEffect(() => {
    if (!isModalOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !submitting) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isModalOpen, submitting, closeModal])
  
  const fetchGrades = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/courses/grade-levels/')
      setGrades(unwrapListData(res.data))
      setError(null)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: 'cargar los grados',
        fallback: 'No se pudieron cargar los grados. Verifica tu institucion activa e intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setError(null)
    setSuccess('')
    setFormData({ ...INITIAL_FORM_DATA })
    setIsModalOpen(true)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      await api.post('/api/v1/courses/grade-levels/', formData)
      closeModal()
      await fetchGrades()
      setSuccess('Grado guardado correctamente.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'guardar el grado',
        fallback: 'No se pudo guardar el grado. Verifica el nombre y el orden ingresado.',
      }))
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading && grades.length === 0) return <div>Cargando grados...</div>
  
  return (
    <div className="admin-page sections-page grade-levels-page">
      <div className="sections-page__header">
        <h1>Gestión de Grados</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Nuevo Grado
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card sections-page__list-card">
        <div className="sections-page__list-header">
          <h2>Listado</h2>
        </div>

        <div className="table-container sections-table-container">
          <table className="table mobile-card-view">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="2" className="text-center">
                    Cargando...
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="2" className="text-center">
                    No hay grados registrados. Crea el primero.
                  </td>
                </tr>
              ) : (
                grades.map(g => (
                  <tr key={g.id}>
                    <td data-label="Nombre">{g.name}</td>
                    <td data-label="Estado">
                      <span
                        className={`badge ${g.is_active ? 'badge-success' : 'badge-secondary'}`}
                      >
                        {g.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="sections-modal-backdrop" onClick={!submitting ? closeModal : undefined}>
          <div
            className="sections-modal modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="grade-levels-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="grade-levels-modal-title">Nuevo Grado</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="grade-level-name">Nombre del Grado</label>
                <input
                  id="grade-level-name"
                  type="text"
                  className="form-control"
                  placeholder="Ej.: 6, 7, 8"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group sections-modal__checkbox-group">
                <label className="sections-modal__checkbox" htmlFor="grade-level-active-checkbox">
                  <span>Activo</span>
                  <input
                    id="grade-level-active-checkbox"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                </label>
              </div>

              <div className="sections-modal__actions">
                <button type="submit" className="btn sections-modal__save" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" className="btn sections-modal__cancel" onClick={closeModal} disabled={submitting}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
