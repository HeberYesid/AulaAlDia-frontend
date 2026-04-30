import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/axios'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'
import { unwrapListData } from '../../utils/pagination'

const INITIAL_CURRICULUM_SUBJECT = { name: '' }
const createInitialFormData = () => ({
  name: '',
  scope_type: 'TENANT_DEFAULT',
  subjects: [{ ...INITIAL_CURRICULUM_SUBJECT }],
})
const INITIAL_EDIT_FORM_DATA = { name: '' }
const createInitialEditFormData = () => ({ ...INITIAL_EDIT_FORM_DATA })
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false)
  const [formData, setFormData] = useState(() => createInitialFormData())
  const [editFormData, setEditFormData] = useState(() => createInitialEditFormData())
  const [editingCurriculumId, setEditingCurriculumId] = useState(null)
  const [cloneFormData, setCloneFormData] = useState(() => ({ ...INITIAL_CLONE_FORM_DATA }))
  const [submitting, setSubmitting] = useState(false)

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
    setFormData(createInitialFormData())
  }, [])

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setEditingCurriculumId(null)
    setEditFormData(createInitialEditFormData())
  }, [])

  const closeCloneModal = useCallback(() => {
    setIsCloneModalOpen(false)
    setCloneFormData({ ...INITIAL_CLONE_FORM_DATA })
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen && !isCloneModalOpen && !isEditModalOpen) return

    const handleEscape = (event) => {
      if (event.key !== 'Escape' || submitting) {
        return
      }

      if (isCloneModalOpen) {
        closeCloneModal()
        return
      }

      if (isEditModalOpen) {
        closeEditModal()
        return
      }

      closeCreateModal()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isCreateModalOpen, isCloneModalOpen, isEditModalOpen, submitting, closeCreateModal, closeEditModal, closeCloneModal])

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
    closeEditModal()
    setIsCloneModalOpen(false)
    setFormData(createInitialFormData())
    setIsCreateModalOpen(true)
  }

  const openEditModal = (curriculum) => {
    setError(null)
    setSuccess('')
    setIsCreateModalOpen(false)
    setIsCloneModalOpen(false)
    setEditingCurriculumId(curriculum.id)
    setEditFormData({ name: curriculum.name || '' })
    setIsEditModalOpen(true)
  }

  const openCloneModal = (curriculum) => {
    if (gradeLevels.length === 0) {
      setError('Primero debes crear al menos un grado para poder clonar una malla.')
      return
    }

    setError(null)
    setSuccess('')
    setIsCreateModalOpen(false)
    closeEditModal()
    setCloneFormData({
      curriculumId: curriculum.id,
      curriculumName: curriculum.name,
      gradeLevelId: '',
    })
    setIsCloneModalOpen(true)
  }

  const handleSubjectChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject, subjectIndex) => (
        subjectIndex === index ? { ...subject, [field]: value } : subject
      )),
    }))
  }

  const addSubjectRow = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...INITIAL_CURRICULUM_SUBJECT }],
    }))
  }

  const removeSubjectRow = (index) => {
    setFormData((prev) => {
      if (prev.subjects.length <= 1) return prev

      return {
        ...prev,
        subjects: prev.subjects.filter((_, subjectIndex) => subjectIndex !== index),
      }
    })
  }

  const normalizeSubjectName = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

  const buildSubjectsPayload = (subjects) => {
    const payload = []
    const normalizedNames = new Map()

    for (let index = 0; index < subjects.length; index += 1) {
      const subject = subjects[index]
      const cleanedName = String(subject.name || '').trim().replace(/\s+/g, ' ')
      if (!cleanedName) {
        return {
          payload: null,
          error: `La materia #${index + 1} debe incluir un nombre valido.`,
        }
      }

      const normalizedName = normalizeSubjectName(cleanedName)
      if (normalizedNames.has(normalizedName)) {
        const firstPosition = normalizedNames.get(normalizedName)
        return {
          payload: null,
          error: `No se permiten materias duplicadas. Conflicto entre #${firstPosition} y #${index + 1}.`,
        }
      }
      normalizedNames.set(normalizedName, index + 1)

      payload.push({ name: cleanedName })
    }

    return { payload, error: null }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const { payload: subjectsPayload, error: subjectsError } = buildSubjectsPayload(formData.subjects)
    if (subjectsError) {
      setError(subjectsError)
      setSuccess('')
      return
    }

    if (!subjectsPayload || subjectsPayload.length === 0) {
      setError('Debes agregar al menos una materia para crear la malla.')
      setSuccess('')
      return
    }

    const curriculumName = String(formData.name || '').trim().replace(/\s+/g, ' ')
    if (!curriculumName) {
      setError('Debes ingresar un nombre valido para la malla.')
      setSuccess('')
      return
    }

    const curriculumPayload = {
      name: curriculumName,
      scope_type: formData.scope_type,
      subjects: subjectsPayload,
    }

    try {
      setSubmitting(true)
      await api.post('/api/v1/courses/curriculums/', curriculumPayload)
      closeCreateModal()
      await fetchData()
      showSuccessMessage('Malla curricular guardada correctamente.')
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'guardar la malla curricular',
        fallback: 'No se pudo guardar la malla curricular. Revisa el nombre, el alcance y las materias seleccionadas.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    if (!editingCurriculumId) {
      setError('No se pudo identificar la malla a editar.')
      setSuccess('')
      return
    }

    const curriculumName = String(editFormData.name || '').trim().replace(/\s+/g, ' ')
    if (!curriculumName) {
      setError('Debes ingresar un nombre valido para la malla.')
      setSuccess('')
      return
    }

    try {
      setSubmitting(true)
      await api.patch(`/api/v1/courses/curriculums/${editingCurriculumId}/`, {
        name: curriculumName,
      })

      closeEditModal()
      await fetchData()
      showSuccessMessage('Malla curricular actualizada correctamente.')
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'actualizar la malla curricular',
        fallback: 'No se pudo actualizar la malla curricular. Revisa el nombre e intentalo nuevamente.',
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

  const handleToggleActive = async (curriculum) => {
    try {
      setSubmitting(true)
      await api.patch(`/api/v1/courses/curriculums/${curriculum.id}/`, {
        is_active: !curriculum.is_active,
      })

      await fetchData()
      showSuccessMessage(
        curriculum.is_active
          ? 'Malla curricular desactivada correctamente.'
          : 'Malla curricular activada correctamente.',
      )
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: curriculum.is_active ? 'desactivar la malla curricular' : 'activar la malla curricular',
        fallback: 'No se pudo actualizar el estado de la malla curricular. Intentalo nuevamente.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (curriculum) => {
    const confirmationMessage = curriculum.scope_type === 'GRADE'
      ? 'Seguro que queres eliminar esta malla? El grado volvera a usar la malla por defecto.'
      : curriculum.is_default
        ? 'Seguro que queres eliminar la malla por defecto? Las nuevas configuraciones no tendran una malla base.'
        : 'Seguro que queres eliminar esta malla?'

    if (!window.confirm(confirmationMessage)) {
      return
    }

    try {
      setSubmitting(true)
      await api.delete(`/api/v1/courses/curriculums/${curriculum.id}/`)
      await fetchData()
      showSuccessMessage('Malla curricular eliminada correctamente.')
    } catch (err) {
      console.error(err)
      setSuccess('')
      setError(getApiErrorMessage(err, {
        action: 'eliminar la malla curricular',
        fallback: 'No se pudo eliminar la malla curricular. Intentalo nuevamente.',
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
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openCloneModal(curriculum)}
                            disabled={submitting}
                          >
                            Clonar para Grado
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openEditModal(curriculum)}
                          disabled={submitting}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm secondary academic-admin__toggle-btn ${curriculum.is_active ? 'is-active' : 'is-inactive'}`}
                          onClick={() => handleToggleActive(curriculum)}
                          disabled={submitting}
                        >
                          {curriculum.is_active ? 'Desactivar' : 'Activar'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(curriculum)}
                          disabled={submitting}
                        >
                          Eliminar
                        </button>
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

              <div className="form-group curriculum-subjects-form-group">
                <div className="curriculum-subjects-form-group__header">
                  <label>Materias de la Malla</label>
                  <button
                    type="button"
                    className="btn secondary curriculum-subjects-form-group__add-btn"
                    onClick={addSubjectRow}
                    disabled={submitting}
                  >
                    Agregar materia
                  </button>
                </div>

                <p className="curriculum-subjects-form-group__hint">
                  Defini las materias iniciales que van a componer esta malla curricular.
                </p>

                <div className="curriculum-subjects-list">
                  {formData.subjects.map((subject, index) => (
                    <div key={`curriculum-subject-${index}`} className="curriculum-subject-row">
                      <div className="curriculum-subject-row__fields">
                        <div className="form-group">
                          <label htmlFor={`curriculum-subject-name-${index}`}>Materia #{index + 1}</label>
                          <input
                            id={`curriculum-subject-name-${index}`}
                            type="text"
                            className="form-control"
                            value={subject.name}
                            onChange={(event) => handleSubjectChange(index, 'name', event.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn danger curriculum-subject-row__remove-btn"
                        onClick={() => removeSubjectRow(index)}
                        disabled={submitting || formData.subjects.length === 1}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
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

      {isEditModalOpen && (
        <div className="sections-modal-backdrop" onClick={!submitting ? closeEditModal : undefined}>
          <div
            className="sections-modal modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="curriculums-edit-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="curriculums-edit-modal-title">Editar Malla</h2>
            <p className="curriculums-clone-modal__hint">
              Desde esta pantalla puedes actualizar el nombre de la malla sin alterar sus materias.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="curriculum-edit-name">Nombre de la Malla</label>
                <input
                  id="curriculum-edit-name"
                  type="text"
                  className="form-control"
                  value={editFormData.name}
                  onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                  required
                />
              </div>

              <div className="sections-modal__actions">
                <button type="submit" className="btn sections-modal__save" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn sections-modal__cancel"
                  onClick={closeEditModal}
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
