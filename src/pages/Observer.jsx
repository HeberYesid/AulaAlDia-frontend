import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { useStudentSearch } from '../hooks/useStudentSearch'
import { useObservations, CATEGORIES, CATEGORY_MAP, INITIAL_FORM } from '../hooks/useObservations'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

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

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" role="status" aria-label="Cargando observaciones..."></div>
          <p>Cargando observaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="fade-in">
      {/* Header */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1 style={{ margin: 0 }}><span aria-hidden="true">📋 </span>Observador</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
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
        <div className="card" id="observation-form" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ marginTop: 0 }}>Nueva Observación</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
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
                <div style={{ minHeight: '1.25rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedStudent
                    ? `Seleccionado: ${selectedStudent.full_name} · ${selectedStudent.email}`
                    : studentSearch.trim().length >= 2
                      ? 'Selecciona un estudiante de las sugerencias.'
                      : 'Escribe al menos 2 caracteres para buscar.'}
                </div>
                {studentSearchLoading && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Buscando estudiantes...
                  </div>
                )}
                {!selectedStudent && studentOptions.length > 0 && (
                  <div
                    role="listbox"
                    aria-label="Sugerencias de estudiantes"
                    style={{
                      marginTop: '0.5rem',
                      border: '1px solid var(--border-secondary)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-hover)',
                      overflow: 'hidden',
                    }}
                  >
                    {studentOptions.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        className="btn secondary"
                        onClick={() => handleStudentSelect(student)}
                        style={{
                          width: '100%',
                          border: 'none',
                          borderBottom: '1px solid var(--border-secondary)',
                          borderRadius: 0,
                          justifyContent: 'flex-start',
                          padding: '0.75rem 1rem',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span>
                          <strong>{student.full_name}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {student.email}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {!selectedStudent && !studentSearchLoading && studentSearch.trim().length >= 2 && studentOptions.length === 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
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
            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label htmlFor="obs-desc">Descripción *</label>
              <textarea
                id="obs-desc"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                required
                rows={4}
                placeholder="Describe la situación con detalle..."
                style={{ resize: 'vertical' }}
              />
            </div>
            {formError && (
              <p style={{ color: 'var(--danger)', marginTop: 'var(--space-sm)' }} role="alert">{formError}</p>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
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
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        {CATEGORIES.map(c => (
          <div className="stat-card" key={c.value}>
            <div className="stat-value" style={{ color: c.color }}>{stats.byCategory[c.value]}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
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
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '3rem', margin: 0 }}>📭</p>
            <p style={{ fontSize: '1.2rem', margin: '1rem 0 0 0' }}>
              {observations.length === 0
                ? 'No hay observaciones registradas.'
                : 'No se encontraron observaciones con esos filtros.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table mobile-card-view" style={{ width: '100%' }}>
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
                  <th scope="col" style={{ textAlign: 'center' }}>Acciones</th>
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
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleToggleExpand(o.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleExpand(o.id) }}
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`Observación: ${o.title}`}
                    >
                      <td data-label="Fecha" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(o.occurred_on || o.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <br />
                        <span style={{ fontSize: '0.75rem' }}>
                          {o.occurred_on
                            ? 'Hechos reportados'
                            : new Date(o.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                        <td data-label="Estudiante" style={{ fontSize: '0.85rem' }}>
                          <strong>{o.student_name || '—'}</strong>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {o.student_email_display}
                          </span>
                        </td>
                      )}
                      <td data-label="Categoría">
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: cat.color,
                          color: 'white',
                          whiteSpace: 'nowrap',
                        }}>
                          {o.category_display || cat.label}
                        </span>
                      </td>
                      <td data-label="Materia" style={{ fontSize: '0.85rem' }}>
                        {o.subject_name || 'General'}
                      </td>
                      <td data-label="Título" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {o.title}
                        {isExpanded && (
                          <div
                            style={{
                              fontWeight: 'normal',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              marginTop: 'var(--space-sm)',
                              padding: 'var(--space-sm)',
                              background: 'var(--bg-hover)',
                              borderRadius: 'var(--radius-sm)',
                              whiteSpace: 'pre-wrap',
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            {o.description}
                          </div>
                        )}
                      </td>
                      <td data-label="Profesor" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {o.teacher_name}
                      </td>
                      <td data-label="Acciones" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            className="btn sm"
                            onClick={(e) => { e.stopPropagation(); handleToggleExpand(o.id) }}
                            title={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minWidth: 'auto' }}
                          >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </button>
                          {canDelete && (
                            <button
                              className="btn sm danger"
                              onClick={(e) => { e.stopPropagation(); handleDelete(o.id) }}
                              title="Eliminar observación"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minWidth: 'auto' }}
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
