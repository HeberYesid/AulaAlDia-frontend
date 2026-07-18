import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { unwrapListData } from '../utils/pagination'

const INITIAL_FORM = {
  student_id: '',
  subject_id: '',
  date: '',
  justified: false,
  reason: '',
}

const buildStudentLabel = (student) => {
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim()
  return fullName ? `${fullName} (${student.email})` : student.email
}

const getAbsenceStatusClassName = (justified) => {
  return justified
    ? 'absences__status-badge absences__status-badge--justified'
    : 'absences__status-badge absences__status-badge--unjustified'
}

export default function Absences() {
  const { user } = useAuth()
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [subjectStudents, setSubjectStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [justifiedFilter, setJustifiedFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  const loadAbsences = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/v1/courses/absences/')
      setAbsences(unwrapListData(res.data))
    } catch (err) {
      console.error('Error loading absences:', err)
      const errorCode = err?.response?.data?.error_code
      if (errorCode === 'NO_ACTIVE_ACADEMIC_PERIOD') {
        setError('Todavía no hay un período abierto para hoy en las faltas. Abre uno o ajusta sus fechas en Configuración académica.')
      } else {
        setError(err?.response?.data?.detail || 'No se pudieron cargar las faltas.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const res = await api.get('/api/v1/courses/subjects/')
      setSubjects(unwrapListData(res.data))
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }

  const loadSubjectStudents = async (subjectId) => {
    if (!subjectId) {
      setSubjectStudents([])
      return
    }

    setLoadingStudents(true)
    try {
      const res = await api.get(`/api/v1/courses/subjects/${subjectId}/enrollments/`)
      const enrollments = unwrapListData(res.data)
      const students = enrollments
        .map((enrollment) => enrollment.student)
        .filter(Boolean)
        .sort((left, right) => buildStudentLabel(left).localeCompare(buildStudentLabel(right), 'es'))
      setSubjectStudents(students)
    } catch (err) {
      console.error('Error loading subject students:', err)
      setSubjectStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadAbsences()
    loadSubjects()
  }, [])

  useEffect(() => {
    if (!showForm || !form.subject_id) {
      setSubjectStudents([])
      return
    }

    loadSubjectStudents(form.subject_id)
  }, [form.subject_id, showForm])

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

    if (name === 'subject_id') {
      setForm((prev) => ({
        ...prev,
        subject_id: value,
        student_id: '',
      }))
      setFormError('')
      return
    }

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
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        date: form.date,
        justified: form.justified,
      }
      if (form.reason.trim()) {
        payload.reason = form.reason.trim()
      }
      await api.post('/api/v1/courses/absences/', payload)
      setForm(INITIAL_FORM)
      setSubjectStudents([])
      setShowForm(false)
      loadAbsences()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const messages = Object.values(data).flat().join(' ')
        setFormError(messages || getApiErrorMessage(err, {
          action: 'registrar la falta de asistencia',
          fallback: 'No se pudo registrar la falta. Verifica estudiante, materia y fecha.',
        }))
      } else {
        setFormError('No se pudo registrar la falta porque no hay conexion con el servidor. Intentalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      title: 'Eliminar falta',
      message: '¿Estás seguro de que quieres eliminar esta falta?',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await api.delete(`/api/v1/courses/absences/${id}/`)
          loadAbsences()
        } catch (err) {
          console.error('Error deleting absence:', err)
        }
      },
    })
  }

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return (
      <div className="card">
        <div className="absences__loading">
          <div className="spinner" role="status" aria-label="Cargando faltas de asistencia..."></div>
          <p>Cargando faltas de asistencia...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="fade-in">
      {/* Header */}
      <div className="card absences__header-card">
        <div className="absences__header-content">
          <div>
            <h1 className="absences__header-title"><span aria-hidden="true">📋 </span>Faltas de Asistencia</h1>
            <p className="absences__header-subtitle">
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
        <div className="card absences__form-card" id="absence-form">
          <h3 className="absences__form-title">Registrar Falta</h3>
          <form onSubmit={handleSubmit}>
            <div className="absences__form-grid">
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
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="abs-student">Estudiante *</label>
                <select
                  id="abs-student"
                  name="student_id"
                  value={form.student_id}
                  onChange={handleFormChange}
                  required
                  disabled={!form.subject_id || loadingStudents || subjectStudents.length === 0}
                >
                  <option value="">
                    {loadingStudents
                      ? 'Cargando estudiantes...'
                      : subjectStudents.length > 0
                        ? '— Seleccionar estudiante —'
                        : form.subject_id
                          ? 'No hay estudiantes disponibles'
                          : 'Selecciona una materia'}
                  </option>
                  {subjectStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {buildStudentLabel(student)}
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

            <div className="absences__justified-row">
              <input
                id="abs-justified"
                type="checkbox"
                name="justified"
                checked={form.justified}
                onChange={handleFormChange}
                className="absences__justified-checkbox"
              />
              <label htmlFor="abs-justified" className="absences__justified-label">
                Falta justificada
              </label>
            </div>

            <div className="form-group absences__reason-group">
              <label htmlFor="abs-reason">Motivo (opcional)</label>
              <textarea
                id="abs-reason"
                name="reason"
                value={form.reason}
                onChange={handleFormChange}
                rows={3}
                placeholder="Motivo de la falta o justificación..."
                className="absences__reason-input"
              />
            </div>

            {formError && (
              <p className="absences__form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="absences__form-actions">
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar Falta'}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setShowForm(false)
                  setForm(INITIAL_FORM)
                  setSubjectStudents([])
                  setFormError('')
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <Alert type="error" message={error} />}

      {/* Stats */}
      <div className="stats-grid absences__stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Faltas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value absences__stat-value--justified">
            {stats.justified}
          </div>
          <div className="stat-label">Justificadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value absences__stat-value--unjustified">
            {stats.unjustified}
          </div>
          <div className="stat-label">Injustificadas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card absences__filters-card">
        <div className="absences__filters-grid">
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
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Absences list */}
      <div className="card">
        {filteredAbsences.length === 0 ? (
          <div className="absences__empty-state">
            <p className="absences__empty-icon">📭</p>
            <p className="absences__empty-message">
              {absences.length === 0
                ? 'No hay faltas de asistencia registradas.'
                : 'No se encontraron faltas con esos filtros.'}
            </p>
          </div>
        ) : (
          <div className="absences__table-wrapper">
            <table className="table mobile-card-view absences__table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                    <th scope="col">Estudiante</th>
                  )}
                  <th scope="col">Materia</th>
                  <th scope="col" className="absences__th-center">Estado</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Registrado por</th>
                  <th scope="col" className="absences__th-center">Acciones</th>
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
                      className="absences__row"
                      onClick={() => handleToggleExpand(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleToggleExpand(a.id)
                      }}
                      tabIndex={0}
                    >
                      <td data-label="Fecha" className="absences__date-cell">
                        {new Date(a.date + 'T00:00:00').toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {(isTeacherOrAdmin || user?.role === 'TUTOR') && (
                        <td data-label="Estudiante" className="absences__student-cell">
                          <strong>{a.student_name || '—'}</strong>
                          <br />
                          <span className="absences__student-email">
                            {a.student_email_display}
                          </span>
                        </td>
                      )}
                      <td data-label="Materia" className="absences__subject-cell">
                        <strong>{a.subject_name}</strong>
                      </td>
                      <td data-label="Estado" className="absences__status-cell">
                        <span className={getAbsenceStatusClassName(a.justified)}>
                          {a.justified ? 'Justificada' : 'Injustificada'}
                        </span>
                      </td>
                      <td data-label="Motivo" className="absences__reason-cell">
                        {a.reason
                          ? isExpanded
                            ? a.reason
                            : a.reason.length > 60
                              ? a.reason.substring(0, 60) + '...'
                              : a.reason
                          : '—'}
                      </td>
                      <td data-label="Registrado por" className="absences__recorded-by-cell">
                        {a.recorded_by_name || '—'}
                      </td>
                      <td data-label="Acciones" className="absences__actions-cell">
                        <div className="absences__actions">
                          <button
                            className="btn sm absences__action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleExpand(a.id)
                            }}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? `Ocultar detalle de falta del ${a.date}` : `Ver detalle de falta del ${a.date}`}
                          >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </button>
                          {canDelete && (
                            <button
                              className="btn sm danger absences__action-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(a.id)
                              }}
                              title="Eliminar falta"
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
