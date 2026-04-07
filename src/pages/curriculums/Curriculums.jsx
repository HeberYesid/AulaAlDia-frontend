import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/axios'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'
import { unwrapListData } from '../../utils/pagination'

const INITIAL_FORM_DATA = { name: '', scope_type: 'TENANT_DEFAULT', is_active: true }
const INITIAL_CLONE_FORM_DATA = { curriculumId: null, curriculumName: '', gradeLevelId: '' }

const SCOPE_LABELS = {
  TENANT_DEFAULT: 'Global (Institucion)',
  GRADE: 'Por Grado',
  COURSE: 'Por Curso',
}

export default function Curriculums() {
  const [curriculums, setCurriculums] = useState([])
  const [gradeLevels, setGradeLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false)
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_DATA }))
  const [cloneFormData, setCloneFormData] = useState(() => ({ ...INITIAL_CLONE_FORM_DATA }))
  const [submitting, setSubmitting] = useState(false)

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
    setFormData({ ...INITIAL_FORM_DATA })
  }, [])

  const closeCloneModal = useCallback(() => {
    setIsCloneModalOpen(false)
    setCloneFormData({ ...INITIAL_CLONE_FORM_DATA })
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen && !isCloneModalOpen) return

    const handleEscape = (event) => {
      if (event.key !== 'Escape' || submitting) {
        return
      }

      if (isCloneModalOpen) {
        closeCloneModal()
        return
      }

      closeCreateModal()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isCreateModalOpen, isCloneModalOpen, submitting, closeCreateModal, closeCloneModal])

  const showSuccessMessage = (message) => {
    setSuccess(message)
    window.setTimeout(() => setSuccess(''), 3000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [curriculumsRes, gradeLevelsRes] = await Promise.all([
        api.get('/api/v1/courses/curriculums/'),
        api.get('/api/v1/courses/grade-levels/'),
      ])

      setCurriculums(unwrapListData(curriculumsRes.data))
      setGradeLevels(unwrapListData(gradeLevelsRes.data))
      setError(null)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: 'cargar la configuracion de mallas curriculares',
        fallback: 'No se pudo cargar la informacion de mallas y grados. Verifica tu institucion activa e intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setError(null)
    setSuccess('')
    setIsCloneModalOpen(false)
    setFormData({ ...INITIAL_FORM_DATA })
    setIsCreateModalOpen(true)
  }

  const openCloneModal = (curriculum) => {
    if (gradeLevels.length === 0) {
      setError('Primero debes crear al menos un grado para poder clonar una malla.')
      return
    }

    setError(null)
    setSuccess('')
    setIsCreateModalOpen(false)
    setCloneFormData({
      curriculumId: curriculum.id,
      curriculumName: curriculum.name,
      gradeLevelId: '',
    })
    setIsCloneModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      await api.post('/api/v1/courses/curriculums/', formData)
      closeCreateModal()
      await fetchData()
      showSuccessMessage('Malla curricular guardada correctamente.')
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'guardar la malla curricular',
        fallback: 'No se pudo guardar la malla curricular. Revisa el nombre y el alcance seleccionado.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloneSubmit = async (event) => {
    event.preventDefault()

    const parsedGradeLevelId = Number.parseInt(cloneFormData.gradeLevelId, 10)
    if (Number.isNaN(parsedGradeLevelId) || parsedGradeLevelId < 1) {
      setError('Debes seleccionar un grado valido para clonar la malla.')
      return
    }

    try {
      setSubmitting(true)
      await api.post(`/api/v1/courses/curriculums/${cloneFormData.curriculumId}/clone-to-grade/`, {
        grade_level_id: parsedGradeLevelId,
      })

      closeCloneModal()
      await fetchData()
      showSuccessMessage('Malla curricular clonada correctamente para el grado seleccionado.')
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'clonar la malla para el grado indicado',
        fallback: 'No se pudo clonar la malla. Verifica que el grado exista y pertenezca a tu institucion.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async (id) => {
    if (!window.confirm('Seguro que queres desvincular esta malla? El grado volvera a usar la malla por defecto.')) {
      return
    }

    try {
      setSubmitting(true)
      await api.delete(`/api/v1/courses/curriculums/${id}/`)
      await fetchData()
      showSuccessMessage('Malla curricular desvinculada correctamente.')
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'desvincular la malla curricular',
        fallback: 'No se pudo desvincular la malla curricular. Intentalo nuevamente.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && curriculums.length === 0) return <div>Cargando mallas curriculares...</div>

  return (
    <div className="admin-page sections-page curriculums-page">
      <div className="sections-page__header">
        <h1>Gestion de Mallas Curriculares</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Nueva Malla
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card sections-page__list-card">
        <div className="sections-page__list-header">
          <h2>Listado</h2>
        </div>

        <div className="table-container sections-table-container">
          <table className="table mobile-card-view sections-table curriculums-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Alcance</th>
                <th>Por defecto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="5" className="text-center">
                    Cargando...
                  </td>
                </tr>
              ) : curriculums.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="5" className="text-center">
                    No hay mallas registradas. Crea la primera.
                  </td>
                </tr>
              ) : (
                curriculums.map((curriculum) => (
                  <tr key={curriculum.id}>
                    <td data-label="Nombre">{curriculum.name}</td>
                    <td data-label="Alcance">{SCOPE_LABELS[curriculum.scope_type] || curriculum.scope_type}</td>
                    <td data-label="Por defecto">{curriculum.is_default ? 'Si' : 'No'}</td>
                    <td data-label="Estado">
                      <span className={`badge ${curriculum.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {curriculum.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="curriculums-table__actions">
                        {curriculum.scope_type === 'TENANT_DEFAULT' && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openCloneModal(curriculum)}
                            disabled={submitting}
                          >
                            Clonar para Grado
                          </button>
                        )}

                        {curriculum.scope_type === 'GRADE' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleUnlink(curriculum.id)}
                            disabled={submitting}
                          >
                            Desvincular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="sections-modal-backdrop" onClick={!submitting ? closeCreateModal : undefined}>
          <div
            className="sections-modal modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="curriculums-create-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="curriculums-create-modal-title">Nueva Malla</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="curriculum-name">Nombre de la Malla</label>
                <input
                  id="curriculum-name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="curriculum-scope">Alcance</label>
                <select
                  id="curriculum-scope"
                  className="form-control"
                  value={formData.scope_type}
                  onChange={(event) => setFormData({ ...formData, scope_type: event.target.value })}
                >
                  <option value="TENANT_DEFAULT">Global (Institucion)</option>
                  <option value="GRADE">Por Grado</option>
                  <option value="COURSE">Por Curso</option>
                </select>
              </div>

              <div className="form-group sections-modal__checkbox-group">
                <label className="sections-modal__checkbox" htmlFor="curriculum-active-checkbox">
                  <span>Activa</span>
                  <input
                    id="curriculum-active-checkbox"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                  />
                </label>
              </div>

              <div className="sections-modal__actions">
                <button type="submit" className="btn sections-modal__save" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className="btn sections-modal__cancel"
                  onClick={closeCreateModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCloneModalOpen && (
        <div className="sections-modal-backdrop" onClick={!submitting ? closeCloneModal : undefined}>
          <div
            className="sections-modal modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="curriculums-clone-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="curriculums-clone-modal-title">Clonar Malla a Grado</h2>
            <p className="curriculums-clone-modal__hint">
              Se clonara <strong>{cloneFormData.curriculumName}</strong> al grado que selecciones.
            </p>

            <form onSubmit={handleCloneSubmit}>
              <div className="form-group">
                <label htmlFor="curriculum-clone-grade">Grado destino</label>
                <select
                  id="curriculum-clone-grade"
                  className="form-control"
                  value={cloneFormData.gradeLevelId}
                  onChange={(event) => setCloneFormData({ ...cloneFormData, gradeLevelId: event.target.value })}
                  required
                >
                  <option value="">Selecciona un grado</option>
                  {gradeLevels.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sections-modal__actions">
                <button type="submit" className="btn sections-modal__save" disabled={submitting}>
                  {submitting ? 'Clonando...' : 'Clonar'}
                </button>
                <button
                  type="button"
                  className="btn sections-modal__cancel"
                  onClick={closeCloneModal}
                  disabled={submitting}
                >
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
