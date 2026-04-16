import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { useStudentSearch } from '../hooks/useStudentSearch'
import { useObservations, CATEGORIES, CATEGORY_MAP, INITIAL_FORM } from '../hooks/useObservations'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import './Observer.css'

export default function Observer() {
  const { user } = useAuth()
  
  const {
    isTeacherOrAdmin,
    observations,
    loading,
    subjects,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    subjectFilter,
    setSubjectFilter,
    filteredObservations,
    stats,
    submitObservation,
    deleteObservation
  } = useObservations(user)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const {
    searchTerm: studentSearch,
    setSearchTerm: setStudentSearch,
    options: studentOptions,
    loading: studentSearchLoading,
    selectedStudent,
    setSelectedStudent,
    clearSearch: clearStudentSearch
  } = useStudentSearch('', showForm && isTeacherOrAdmin)

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleStudentSearchChange = (e) => {
    const { value } = e.target
    setStudentSearch(value)
    setSelectedStudent(null)
    setForm(prev => ({ ...prev, student_email: '' }))
    setFormError('')
  }

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setStudentSearch(student.full_name)
    setForm(prev => ({ ...prev, student_email: student.email }))
    setFormError('')
  }

  const resetObservationForm = () => {
    setForm(INITIAL_FORM)
    clearStudentSearch()
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.student_email) {
      setFormError('Selecciona un estudiante de la lista antes de guardar la observación.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        student_email: form.student_email,
        category: form.category,
        occurred_on: form.occurred_on,
        title: form.title,
        description: form.description,
      }
      if (form.subject) {
        payload.subject = Number(form.subject)
      }
      await submitObservation(payload)
      resetObservationForm()
      setShowForm(false)
    } catch (err) {
      const data = err?.response?.data
      if (data) {
        const messages = Object.values(data).flat().join(' ')
        setFormError(messages || getApiErrorMessage(err, {
          action: 'crear la observacion',
          fallback: 'No se pudo crear la observacion. Verifica estudiante, categoria y descripcion.',
        }))
      } else {
        setFormError('No se pudo crear la observacion porque no hay conexion con el servidor. Intentalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      title: 'Eliminar observación',
      message: '¿Estás seguro de que quieres eliminar esta observación?',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteObservation(id)
        } catch (err) {
          console.error('Error deleting observation:', err)
        }
      },
    })
  }

  const handleToggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const getCategoryToneClass = (categoryValue) => {
    if (categoryValue === 'MISBEHAVIOR') return 'observer__tone--danger'
    return 'observer__tone--muted'
  }

  if (loading) {
    return (
      <div className="card">
        <div className="observer__loading-state">
          <div className="spinner" role="status" aria-label="Cargando observaciones..."></div>
          <p>Cargando observaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="fade-in observer">
      {/* Header */}
      <div className="card observer__card-gap">
        <div className="observer__header-row">
          <div>
            <h1 className="observer__title"><span aria-hidden="true">📋 </span>Observador</h1>
            <p className="observer__subtitle">
              {isTeacherOrAdmin
                ? 'Registra y consulta observaciones sobre el comportamiento de los estudiantes.'
                : user?.role === 'TUTOR'
                  ? 'Consulta las observaciones de tus estudiantes.'
                  : 'Consulta las observaciones registradas por tus profesores.'
              }
            </p>
          </div>
          {isTeacherOrAdmin && (
            <button
              className="btn primary"
              onClick={() => setShowForm(prev => !prev)}
              aria-expanded={showForm}
              aria-controls="observation-form"
            >
              {showForm ? 'Cancelar' : ' Nueva Observación'}
            </button>
          )}
        </div>
      </div>

      {/* Create form (teacher/admin only) */}
      {showForm && isTeacherOrAdmin && (
        <div className="card observer__card-gap" id="observation-form">
          <h3 className="observer__form-title">Nueva Observación</h3>
          <form onSubmit={handleSubmit}>
            <div className="observer__form-grid">
              <div className="form-group">
                <label htmlFor="obs-student">Estudiante *</label>
                <input
                  id="obs-student"
                  type="text"
                  value={studentSearch}
                  onChange={handleStudentSearchChange}
                  required
                  placeholder="Escribe el nombre del estudiante"
                  autoComplete="off"
                />
                <div className="observer__student-hint">
                  {selectedStudent
                    ? `Seleccionado: ${selectedStudent.full_name} · ${selectedStudent.email}`
                    : studentSearch.trim().length >= 2
                      ? 'Selecciona un estudiante de las sugerencias.'
                      : 'Escribe al menos 2 caracteres para buscar.'}
                </div>
                {studentSearchLoading && (
                  <div className="observer__student-help">
                    Buscando estudiantes...
                  </div>
                )}
                {!selectedStudent && studentOptions.length > 0 && (
                  <div
                    role="listbox"
                    aria-label="Sugerencias de estudiantes"
                    className="observer__student-options"
                  >
                    {studentOptions.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        className="btn secondary observer__student-option"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <span>
                          <strong>{student.full_name}</strong>
                          <span className="observer__student-email">
                            {student.email}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {!selectedStudent && !studentSearchLoading && studentSearch.trim().length >= 2 && studentOptions.length === 0 && (
                  <div className="observer__student-help">
                    No se encontraron estudiantes con ese criterio.
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="obs-subject">Materia (opcional)</label>
                <select
                  id="obs-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                >
                  <option value="">General</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="obs-category">Categoría *</label>
                <select
                  id="obs-category"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="obs-occurred-on">Fecha de los hechos *</label>
                <input
                  id="obs-occurred-on"
                  type="date"
                  name="occurred_on"
                  value={form.occurred_on}
                  onChange={handleFormChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div className="form-group observer__section-gap">
              <label htmlFor="obs-title">Título *</label>
              <input
                id="obs-title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                required
                placeholder="Resumen breve de la observación"
                maxLength={200}
              />
            </div>
            <div className="form-group observer__section-gap">
              <label htmlFor="obs-desc">Descripción *</label>
              <textarea
                id="obs-desc"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                required
                rows={4}
                placeholder="Describe la situación con detalle..."
                className="observer__description-input"
              />
            </div>
            {formError && (
              <p className="observer__form-error" role="alert">{formError}</p>
            )}
            <div className="observer__form-actions">
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar Observación'}
              </button>
              <button type="button" className="btn secondary" onClick={() => { setShowForm(false); resetObservationForm() }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid observer__card-gap">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        {CATEGORIES.map(c => (
          <div className="stat-card" key={c.value}>
            <div className={`stat-value ${getCategoryToneClass(c.value)}`}>{stats.byCategory[c.value]}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card observer__card-gap">
        <div className="observer__filter-grid">
          <div className="form-group">
            <label htmlFor="obs-search">Buscar</label>
            <input
              id="obs-search"
              type="text"
              placeholder="Nombre, email o título..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="obs-filter-cat">Categoría</label>
            <select
              id="obs-filter-cat"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="obs-filter-sub">Materia</label>
            <select
              id="obs-filter-sub"
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {subjects.map(s => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Observations list */}
      <div className="card">
        {filteredObservations.length === 0 ? (
          <div className="observer__empty-state">
            <p className="observer__empty-icon">📭</p>
            <p className="observer__empty-title">
              {observations.length === 0
                ? 'No hay observaciones registradas.'
                : 'No se encontraron observaciones con esos filtros.'}
            </p>
          </div>
        ) : (
          <div className="observer__table-wrap">
            <table className="table mobile-card-view observer__table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                    <th scope="col">Estudiante</th>
                  )}
                  <th scope="col">Categoría</th>
                  <th scope="col">Materia</th>
                  <th scope="col">Título</th>
                  <th scope="col">Profesor</th>
                  <th scope="col" className="observer__actions-head">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredObservations.map(o => {
                  const cat = CATEGORY_MAP[o.category] || CATEGORY_MAP.OTHER
                  const isExpanded = expandedId === o.id
                  const canDelete = isTeacherOrAdmin && (user?.role === 'ADMIN' || o.teacher === user?.id)

                  return (
                    <tr
                      key={o.id}
                      className="observer__row"
                      onClick={() => handleToggleExpand(o.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleExpand(o.id) }}
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`Observación: ${o.title}`}
                    >
                      <td data-label="Fecha" className="observer__date-cell">
                        {new Date(o.occurred_on || o.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <br />
                        <span className="observer__cell-caption">
                          {o.occurred_on
                            ? 'Hechos reportados'
                            : new Date(o.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                        <td data-label="Estudiante" className="observer__student-cell">
                          <strong>{o.student_name || '—'}</strong>
                          <br />
                          <span className="observer__student-cell-email">
                            {o.student_email_display}
                          </span>
                        </td>
                      )}
                      <td data-label="Categoría">
                        <span className={`observer__category-badge ${getCategoryToneClass(o.category)}`}>
                          {o.category_display || cat.label}
                        </span>
                      </td>
                      <td data-label="Materia" className="observer__subject-cell">
                        {o.subject_name || 'General'}
                      </td>
                      <td data-label="Título" className="observer__title-cell">
                        {o.title}
                        {isExpanded && (
                          <div
                            className="observer__description-panel"
                            onClick={e => e.stopPropagation()}
                          >
                            {o.description}
                          </div>
                        )}
                      </td>
                      <td data-label="Profesor" className="observer__teacher-cell">
                        {o.teacher_name}
                      </td>
                      <td data-label="Acciones" className="observer__actions-cell">
                        <div className="observer__actions-wrap">
                          <button
                            className="btn sm observer__action-btn"
                            onClick={(e) => { e.stopPropagation(); handleToggleExpand(o.id) }}
                            title={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                          >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </button>
                          {canDelete && (
                            <button
                              className="btn sm danger observer__action-btn"
                              onClick={(e) => { e.stopPropagation(); handleDelete(o.id) }}
                              title="Eliminar observación"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    {confirmDialog && (
      <ConfirmDialog
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
    </>
  )
}
