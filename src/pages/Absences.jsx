import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'

const INITIAL_FORM = {
  student_email: '',
  subject_id: '',
  date: '',
  justified: false,
  reason: '',
}

export default function Absences() {
  const { user } = useAuth()
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [justifiedFilter, setJustifiedFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  const loadAbsences = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/courses/absences/')
      setAbsences(res.data)
    } catch (err) {
      console.error('Error loading absences:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const res = await api.get('/api/v1/courses/subjects/')
      setSubjects(res.data)
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }

  useEffect(() => {
    loadAbsences()
    loadSubjects()
  }, [])

  const filteredAbsences = useMemo(() => {
    let list = absences
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      list = list.filter(
        (a) =>
          (a.student_name && a.student_name.toLowerCase().includes(term)) ||
          (a.student_email_display && a.student_email_display.toLowerCase().includes(term)) ||
          (a.subject_name && a.subject_name.toLowerCase().includes(term)) ||
          (a.subject_code && a.subject_code.toLowerCase().includes(term))
      )
    }
    if (justifiedFilter !== '') {
      const isJustified = justifiedFilter === 'true'
      list = list.filter((a) => a.justified === isJustified)
    }
    if (subjectFilter) {
      list = list.filter((a) => {
        const matchingSubject = subjects.find((s) => String(s.id) === subjectFilter)
        return matchingSubject && a.subject_code === matchingSubject.code
      })
    }
    return list
  }, [absences, searchTerm, justifiedFilter, subjectFilter, subjects])

  // Stats
  const stats = useMemo(() => {
    const total = absences.length
    const justified = absences.filter((a) => a.justified).length
    const unjustified = total - justified
    return { total, justified, unjustified }
  }, [absences])

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const payload = {
        student_email: form.student_email,
        subject_id: Number(form.subject_id),
        date: form.date,
        justified: form.justified,
      }
      if (form.reason.trim()) {
        payload.reason = form.reason.trim()
      }
      await api.post('/api/v1/courses/absences/', payload)
      setForm(INITIAL_FORM)
      setShowForm(false)
      loadAbsences()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const messages = Object.values(data).flat().join(' ')
        setFormError(messages || 'Error al registrar la falta.')
      } else {
        setFormError('Error de conexión.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta falta?')) return
    try {
      await api.delete(`/api/v1/courses/absences/${id}/`)
      loadAbsences()
    } catch (err) {
      console.error('Error deleting absence:', err)
      const data = err.response?.data
      if (data?.detail) {
        alert(data.detail)
      }
    }
  }

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <p>Cargando faltas de asistencia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>📋 Faltas de Asistencia</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
              {isTeacherOrAdmin
                ? 'Registra y consulta las faltas de asistencia de los estudiantes.'
                : user?.role === 'TUTOR'
                  ? 'Consulta las faltas de asistencia de tus estudiantes.'
                  : 'Consulta tus faltas de asistencia.'}
            </p>
          </div>
          {isTeacherOrAdmin && (
            <button
              className="btn primary"
              onClick={() => setShowForm((prev) => !prev)}
              aria-expanded={showForm}
              aria-controls="absence-form"
            >
              {showForm ? 'Cancelar' : 'Registrar Falta'}
            </button>
          )}
        </div>
      </div>

      {/* Create form (teacher/admin only) */}
      {showForm && isTeacherOrAdmin && (
        <div className="card" id="absence-form" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ marginTop: 0 }}>Registrar Falta</h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-md)',
              }}
            >
              <div className="form-group">
                <label htmlFor="abs-email">Email del estudiante *</label>
                <input
                  id="abs-email"
                  type="email"
                  name="student_email"
                  value={form.student_email}
                  onChange={handleFormChange}
                  required
                  placeholder="estudiante@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="abs-subject">Materia *</label>
                <select
                  id="abs-subject"
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">— Seleccionar —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="abs-date">Fecha *</label>
                <input
                  id="abs-date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-md)',
              }}
            >
              <input
                id="abs-justified"
                type="checkbox"
                name="justified"
                checked={form.justified}
                onChange={handleFormChange}
                style={{ width: 'auto' }}
              />
              <label htmlFor="abs-justified" style={{ margin: 0, cursor: 'pointer' }}>
                Falta justificada
              </label>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label htmlFor="abs-reason">Motivo (opcional)</label>
              <textarea
                id="abs-reason"
                name="reason"
                value={form.reason}
                onChange={handleFormChange}
                rows={3}
                placeholder="Motivo de la falta o justificación..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {formError && (
              <p style={{ color: 'var(--danger)', marginTop: 'var(--space-sm)' }} role="alert">
                {formError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar Falta'}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setShowForm(false)
                  setForm(INITIAL_FORM)
                  setFormError('')
                }}
              >
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
          <div className="stat-label">Total Faltas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>
            {stats.justified}
          </div>
          <div className="stat-label">Justificadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {stats.unjustified}
          </div>
          <div className="stat-label">Injustificadas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          <div className="form-group">
            <label htmlFor="abs-search">Buscar</label>
            <input
              id="abs-search"
              type="text"
              placeholder="Nombre, email o materia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="abs-filter-justified">Tipo</label>
            <select
              id="abs-filter-justified"
              value={justifiedFilter}
              onChange={(e) => setJustifiedFilter(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="true">Justificadas</option>
              <option value="false">Injustificadas</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="abs-filter-sub">Materia</label>
            <select
              id="abs-filter-sub"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Absences list */}
      <div className="card">
        {filteredAbsences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '3rem', margin: 0 }}>📭</p>
            <p style={{ fontSize: '1.2rem', margin: '1rem 0 0 0' }}>
              {absences.length === 0
                ? 'No hay faltas de asistencia registradas.'
                : 'No se encontraron faltas con esos filtros.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table mobile-card-view" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Fecha</th>
                  {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                    <th style={{ width: '180px' }}>Estudiante</th>
                  )}
                  <th style={{ width: '140px' }}>Materia</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Estado</th>
                  <th>Motivo</th>
                  <th style={{ width: '150px' }}>Registrado por</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsences.map((a) => {
                  const isExpanded = expandedId === a.id
                  const canDelete =
                    isTeacherOrAdmin &&
                    (user?.role === 'ADMIN' || a.recorded_by === user?.id)

                  return (
                    <tr
                      key={a.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleToggleExpand(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleToggleExpand(a.id)
                      }}
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`Falta del ${a.date}`}
                    >
                      <td
                        data-label="Fecha"
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(a.date + 'T00:00:00').toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                        <td data-label="Estudiante" style={{ fontSize: '0.85rem' }}>
                          <strong>{a.student_name || '—'}</strong>
                          <br />
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {a.student_email_display}
                          </span>
                        </td>
                      )}
                      <td data-label="Materia" style={{ fontSize: '0.85rem' }}>
                        <strong>{a.subject_code}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {a.subject_name}
                        </span>
                      </td>
                      <td data-label="Estado" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: a.justified ? '#10b981' : '#ef4444',
                            color: 'white',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.justified ? 'Justificada' : 'Injustificada'}
                        </span>
                      </td>
                      <td data-label="Motivo" style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                        {a.reason
                          ? isExpanded
                            ? a.reason
                            : a.reason.length > 60
                              ? a.reason.substring(0, 60) + '...'
                              : a.reason
                          : '—'}
                      </td>
                      <td
                        data-label="Registrado por"
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {a.recorded_by_name || '—'}
                      </td>
                      <td data-label="Acciones" style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center',
                          }}
                        >
                          <button
                            className="btn sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleExpand(a.id)
                            }}
                            title={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              minWidth: 'auto',
                            }}
                          >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </button>
                          {canDelete && (
                            <button
                              className="btn sm danger"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(a.id)
                              }}
                              title="Eliminar falta"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                minWidth: 'auto',
                              }}
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
  )
}
