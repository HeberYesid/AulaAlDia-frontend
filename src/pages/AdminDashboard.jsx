import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import Alert from '../components/Alert'
import SchoolHeader from '../components/SchoolHeader'
import SidebarBanner from '../components/SidebarBanner'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

function toDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toDateOnly(value) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function resolveActiveAcademicPeriod(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null

  const today = toDateOnly(new Date())
  if (!today) return null

  const byOrderAsc = [...periods]
    .filter((period) => !period?.is_closed)
    .filter((period) => {
      const startDate = toDateOnly(period.start_date)
      const endDate = toDateOnly(period.end_date)

      if (startDate && today < startDate) return false
      if (endDate && today > endDate) return false
      return true
    })
    .sort((first, second) => {
      const yearDiff = Number(first.year || 0) - Number(second.year || 0)
      if (yearDiff !== 0) return yearDiff

      const firstSequence = Number(first.sequence || first.period_number || 0)
      const secondSequence = Number(second.sequence || second.period_number || 0)
      return firstSequence - secondSequence
    })

  return byOrderAsc[0] || null
}

function filterItemsByAcademicPeriod(items, academicPeriod, dateField) {
  if (!Array.isArray(items) || items.length === 0 || !academicPeriod) return []

  const startDate = toDateOnly(academicPeriod.start_date)
  const endDate = toDateOnly(academicPeriod.end_date)
  const hasBoundaryDates = Boolean(startDate || endDate)
  const periodYear = Number(academicPeriod.year || 0)

  return items.filter((item) => {
    const date = toDateOnly(item?.[dateField])
    if (!date) return false
    if (!hasBoundaryDates && periodYear > 0 && date.getFullYear() !== periodYear) {
      return false
    }
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  })
}

function formatDate(value) {
  const date = toDate(value)
  if (!date) return '-'
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getPeriodSchemeLabel(value) {
  if (value === 'SEMESTER') return 'Semestral'
  if (value === 'CYCLES') return 'Por ciclos'
  return 'Trimestral'
}

function formatAcademicPeriodLabel(period) {
  if (!period) return '-'

  const label = String(period.label || '').trim()
  if (!label) return '-'

  const simplifiedLabel = label.replace(/^\d{4}\s*[-–—]\s*/u, '')
  const trimmedLabel = simplifiedLabel.replace(/^Trimestre\s+/iu, '')
  return trimmedLabel || simplifiedLabel || label
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState([])
  const [subjectStats, setSubjectStats] = useState([])
  const [absences, setAbsences] = useState([])
  const [observations, setObservations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [academicPeriods, setAcademicPeriods] = useState([])
  const [academicSettings, setAcademicSettings] = useState(null)
  const [blockErrors, setBlockErrors] = useState({})

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const nextBlockErrors = {}
    let nextSubjects = []

    try {
      const [
        subjectsResult,
        absencesResult,
        observationsResult,
        notificationsResult,
        calendarResult,
        periodsResult,
        settingsResult,
      ] = await Promise.allSettled([
        api.get('/api/v1/courses/subjects/'),
        api.get('/api/v1/courses/absences/'),
        api.get('/api/v1/courses/observations/'),
        api.get('/api/v1/courses/notifications/'),
        api.get('/api/v1/courses/calendar/all_events/'),
        api.get('/api/v1/courses/academic-periods/'),
        api.get('/api/v1/courses/academic-settings/'),
      ])

      if (subjectsResult.status === 'fulfilled') {
        nextSubjects = subjectsResult.value.data?.results || subjectsResult.value.data || []
        setSubjects(Array.isArray(nextSubjects) ? nextSubjects : [])
      } else {
        nextBlockErrors.subjects = 'No se pudieron cargar las materias.'
        setSubjects([])
      }

      if (absencesResult.status === 'fulfilled') {
        setAbsences(Array.isArray(absencesResult.value.data) ? absencesResult.value.data : [])
      } else {
        nextBlockErrors.absences = 'No se pudieron cargar las faltas.'
        setAbsences([])
      }

      if (observationsResult.status === 'fulfilled') {
        setObservations(Array.isArray(observationsResult.value.data) ? observationsResult.value.data : [])
      } else {
        nextBlockErrors.observations = 'No se pudieron cargar las observaciones.'
        setObservations([])
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotifications(Array.isArray(notificationsResult.value.data) ? notificationsResult.value.data : [])
      } else {
        nextBlockErrors.notifications = 'No se pudieron cargar las notificaciones.'
        setNotifications([])
      }

      if (calendarResult.status === 'fulfilled') {
        const events = Array.isArray(calendarResult.value.data) ? calendarResult.value.data : []
        const now = new Date()
        const future = events
          .filter((event) => {
            const startValue = event.start || event.start_time || event.date
            const startDate = toDate(startValue)
            return startDate && startDate >= now
          })
          .sort((a, b) => {
            const first = toDate(a.start || a.start_time || a.date)?.getTime() || 0
            const second = toDate(b.start || b.start_time || b.date)?.getTime() || 0
            return first - second
          })
          .slice(0, 5)

        setUpcomingEvents(future)
      } else {
        nextBlockErrors.calendar = 'No se pudieron cargar los eventos del calendario.'
        setUpcomingEvents([])
      }

      if (periodsResult.status === 'fulfilled') {
        const periods = periodsResult.value.data?.results || periodsResult.value.data || []
        setAcademicPeriods(Array.isArray(periods) ? periods : [])
      } else {
        nextBlockErrors.periods = 'No se pudieron cargar los periodos académicos.'
        setAcademicPeriods([])
      }

      if (settingsResult.status === 'fulfilled') {
        setAcademicSettings(settingsResult.value.data || null)
      } else {
        nextBlockErrors.academicSettings = 'No se pudo cargar la configuración académica.'
        setAcademicSettings(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'cargar el panel de administracion',
        fallback: 'No se pudo cargar el panel de administracion. Verifica tu acceso e intentalo nuevamente.',
      }))
    }

    try {
      if (nextSubjects.length > 0) {
        const dashboards = await Promise.allSettled(
          nextSubjects.map((subject) => api.get(`/api/v1/courses/subjects/${subject.id}/dashboard/`))
        )

        const nextSubjectStats = dashboards
          .map((result, index) => {
            if (result.status !== 'fulfilled') return null
            const raw = result.value.data || {}
            const aggregates = raw.aggregates || {}
            const avgGrade = Number(aggregates.avg_grade ?? aggregates.avg_score ?? 0)

            return {
              subjectId: nextSubjects[index].id,
              subjectName: nextSubjects[index].name,
              avgGrade,
            }
          })
          .filter(Boolean)

        setSubjectStats(nextSubjectStats)

        const hasFailures = dashboards.some((item) => item.status === 'rejected')
        if (hasFailures) {
          nextBlockErrors.performance = 'Algunas métricas por materia no estuvieron disponibles.'
        }
      } else {
        setSubjectStats([])
      }
    } catch (err) {
      nextBlockErrors.performance = 'No se pudieron cargar las métricas de rendimiento.'
      setSubjectStats([])
    }

    setBlockErrors(nextBlockErrors)

    if (Object.keys(nextBlockErrors).length > 0) {
      setError('El dashboard cargó parcialmente. Revisa los bloques con alerta.')
    }

    setLoading(false)
  }

  const activeAcademicPeriod = useMemo(() => {
    return resolveActiveAcademicPeriod(academicPeriods)
  }, [academicPeriods])

  const absencesInActivePeriod = useMemo(() => {
    return filterItemsByAcademicPeriod(absences, activeAcademicPeriod, 'date')
  }, [absences, activeAcademicPeriod])

  const observationsInActivePeriod = useMemo(() => {
    return filterItemsByAcademicPeriod(observations, activeAcademicPeriod, 'created_at')
  }, [observations, activeAcademicPeriod])

  const kpis = useMemo(() => {
    const subjectsCount = subjects.length
    const studentsCount = subjects.reduce((acc, subject) => acc + Number(subject.enrollments_count || 0), 0)
    const uniqueTeacherIds = new Set(
      subjects
        .map((subject) => subject?.teacher?.id)
        .filter((teacherId) => teacherId !== null && teacherId !== undefined)
    )
    const teachersCount = uniqueTeacherIds.size
    const currentAcademicYear = activeAcademicPeriod?.year || '-'
    const currentAcademicPeriodLabel = formatAcademicPeriodLabel(activeAcademicPeriod)
    const unreadNotifications = notifications.filter((item) => !item.is_read).length

    return {
      subjectsCount,
      studentsCount,
      teachersCount,
      currentAcademicYear,
      currentAcademicPeriodLabel,
      unreadNotifications,
    }
  }, [subjects, activeAcademicPeriod, notifications])

  const performanceList = useMemo(() => {
    return [...subjectStats]
      .sort((a, b) => b.avgGrade - a.avgGrade)
      .slice(0, 5)
  }, [subjectStats])

  const openPeriods = useMemo(() => {
    return academicPeriods.filter((period) => !period.is_closed).slice(0, 3)
  }, [academicPeriods])

  const openPeriodsSummary = useMemo(() => {
    if (openPeriods.length === 0) return 'Sin períodos académicos abiertos'
    return openPeriods
      .map((period) => `${period.label}${period.is_grade_locked ? ' (bloqueado)' : ''}`)
      .join(', ')
  }, [openPeriods])

  const nextDeadline = useMemo(() => {
    const periodsWithDeadline = academicPeriods
      .filter((period) => !period.is_closed && period.grading_deadline)
      .sort((first, second) => {
        const firstTime = toDate(first.grading_deadline)?.getTime() || 0
        const secondTime = toDate(second.grading_deadline)?.getTime() || 0
        return firstTime - secondTime
      })
    return periodsWithDeadline[0] || null
  }, [academicPeriods])

  const criticalNotifications = useMemo(() => {
    return notifications
      .filter((item) => !item.is_read)
      .sort((a, b) => {
        const first = toDate(a.created_at)?.getTime() || 0
        const second = toDate(b.created_at)?.getTime() || 0
        return second - first
      })
      .slice(0, 5)
  }, [notifications])

  const handleCardClick = (path) => {
    navigate(path)
  }

  const handleCardKeyDown = (event, path) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleCardClick(path)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" role="status" aria-label="Cargando panel de administrador..."></div>
        <span aria-hidden="true">Cargando panel de administrador...</span>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <SchoolHeader />
      <Alert type="error" message={error} />

      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-value">{kpis.subjectsCount}</div>
          <div className="stat-label">Materias</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kpis.studentsCount}</div>
          <div className="stat-label">Estudiantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kpis.teachersCount}</div>
          <div className="stat-label">Profesores</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kpis.currentAcademicYear}</div>
          <div className="stat-label">Año académico actual</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kpis.currentAcademicPeriodLabel}</div>
          <div className="stat-label">Período académico actual</div>
        </div>
      </div>

      <div className="grid-2 admin-dashboard__grid">
        <section
          className="card admin-dashboard__section admin-dashboard__section--interactive"
          role="link"
          tabIndex={0}
          aria-label="Ir a materias"
          onClick={() => handleCardClick('/subjects')}
          onKeyDown={(event) => handleCardKeyDown(event, '/subjects')}
        >
          <h2 className="admin-dashboard__section-title">Rendimiento por materia</h2>
          {blockErrors.performance && <Alert type="error" message={blockErrors.performance} />}
          {performanceList.length === 0 ? (
            <p className="admin-dashboard__muted">No hay métricas disponibles aún.</p>
          ) : (
            <div className="data-table admin-dashboard__table">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Materia</th>
                    <th scope="col">Prom. calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceList.map((item) => (
                    <tr key={item.subjectId}>
                      <td data-label="Materia">
                        <strong>{item.subjectName}</strong>
                      </td>
                      <td data-label="Prom. calificación">{item.avgGrade.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="card admin-dashboard__section admin-dashboard__section--interactive"
          role="link"
          tabIndex={0}
          aria-label="Ir al módulo de asistencia"
          onClick={() => handleCardClick('/absences')}
          onKeyDown={(event) => handleCardKeyDown(event, '/absences')}
        >
          <h2 className="admin-dashboard__section-title">Ausencias</h2>
          {blockErrors.absences && <Alert type="error" message={blockErrors.absences} />}
          <p className="admin-dashboard__muted">
            Hay un total de <strong>{absencesInActivePeriod.length}</strong> ausencias en este periodo.
          </p>
        </section>

        <section
          className="card admin-dashboard__section admin-dashboard__section--interactive"
          role="link"
          tabIndex={0}
          aria-label="Ir al observador"
          onClick={() => handleCardClick('/observer')}
          onKeyDown={(event) => handleCardKeyDown(event, '/observer')}
        >
          <h2 className="admin-dashboard__section-title">Observador</h2>
          {blockErrors.observations && <Alert type="error" message={blockErrors.observations} />}
          <p className="admin-dashboard__muted">
            Hay un total de <strong>{observationsInActivePeriod.length}</strong> observaciones en este periodo.
          </p>
        </section>

        <section
          className="card admin-dashboard__section admin-dashboard__section--interactive"
          role="link"
          tabIndex={0}
          aria-label="Ir a configuración académica"
          onClick={() => handleCardClick('/admin/academic-settings')}
          onKeyDown={(event) => handleCardKeyDown(event, '/admin/academic-settings')}
        >
          <h2 className="admin-dashboard__section-title">Configuración académica</h2>
          {blockErrors.academicSettings && <Alert type="error" message={blockErrors.academicSettings} />}
          {blockErrors.periods && <Alert type="error" message={blockErrors.periods} />}
          {academicSettings ? (
            <ul className="admin-dashboard__list admin-dashboard__list--tight-top">
              <li className="admin-dashboard__list-item">
                <strong>Esquema:</strong> {getPeriodSchemeLabel(academicSettings.period_scheme)}
              </li>
              <li className="admin-dashboard__list-item">
                <strong>Escala:</strong> {academicSettings.min_grade} a {academicSettings.max_grade}
              </li>
              <li className="admin-dashboard__list-item">
                <strong>Nota aprobatoria:</strong> {academicSettings.passing_grade ?? '-'}
              </li>
              <li className="admin-dashboard__list-item">
                <strong>Bloqueo automático al vencer fecha límite:</strong>{' '}
                {academicSettings.lock_grades_after_deadline ? 'Sí' : 'No'}
              </li>
              <li className="admin-dashboard__list-item">
                <strong>Próximo cierre operativo:</strong>{' '}
                {nextDeadline ? `${nextDeadline.label} (${formatDate(nextDeadline.grading_deadline)})` : 'Sin cierre programado'}
              </li>
              <li className="admin-dashboard__list-item">
                <strong>Períodos abiertos:</strong> {openPeriodsSummary}
              </li>
              <li className="admin-dashboard__list-item">
                <strong>Última actualización:</strong> {formatDate(academicSettings.updated_at)}
              </li>
            </ul>
          ) : (
            <p className="admin-dashboard__muted">No hay configuración académica cargada para este tenant.</p>
          )}
        </section>

        <section
          className="card admin-dashboard__section admin-dashboard__section--interactive"
          role="link"
          tabIndex={0}
          aria-label="Ir al calendario completo"
          onClick={() => handleCardClick('/calendar')}
          onKeyDown={(event) => handleCardKeyDown(event, '/calendar')}
        >
          <h2 className="admin-dashboard__section-title">Calendario y próximos hitos</h2>
          {blockErrors.calendar && <Alert type="error" message={blockErrors.calendar} />}
          <h3 className="admin-dashboard__subheading">Eventos próximos</h3>
          {upcomingEvents.length === 0 ? (
            <p className="admin-dashboard__muted">No hay eventos futuros registrados.</p>
          ) : (
            <ul className="admin-dashboard__list admin-dashboard__list--tight-top">
              {upcomingEvents.map((event, index) => {
                const eventStart = event.start || event.start_time || event.date
                return (
                  <li key={`${event.id || event.title}-${index}`} className="admin-dashboard__list-item">
                    <strong>{event.title || 'Evento'}</strong> - {formatDate(eventStart)}
                  </li>
                )
              })}
            </ul>
          )}

          <h3 className="admin-dashboard__subheading admin-dashboard__subheading--spaced">Novedades</h3>
          {blockErrors.notifications && <Alert type="error" message={blockErrors.notifications} />}
          {criticalNotifications.length === 0 ? (
            <p className="admin-dashboard__muted">No hay anuncios generales recientes.</p>
          ) : (
            <ul className="admin-dashboard__list admin-dashboard__list--tight-top">
              {criticalNotifications.map((item) => (
                <li key={item.id} className="admin-dashboard__list-item">
                  <strong>{item.title || 'Anuncio'}</strong> - {formatDate(item.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="card admin-dashboard__section admin-dashboard__section--interactive"
          role="link"
          tabIndex={0}
          aria-label="Ir al módulo de notificaciones"
          onClick={() => handleCardClick('/notifications')}
          onKeyDown={(event) => handleCardKeyDown(event, '/notifications')}
        >
          <h2 className="admin-dashboard__section-title">Notificaciones críticas</h2>
          {blockErrors.notifications && <Alert type="error" message={blockErrors.notifications} />}
          <p className="admin-dashboard__muted admin-dashboard__muted--tight">
            Tienes <strong>{kpis.unreadNotifications}</strong> notificaciones sin leer.
          </p>
          {criticalNotifications.length === 0 ? (
            <p className="admin-dashboard__muted">No hay alertas sin leer.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {criticalNotifications.map((item) => (
                <li key={item.id} className="admin-dashboard__list-item">
                  <strong>{item.title || 'Notificación'}</strong> - {formatDate(item.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card admin-dashboard__section admin-dashboard__quick-actions">
          <h2 className="admin-dashboard__section-title">Accesos rápidos de gestión</h2>
          <p className="admin-dashboard__quick-actions-copy">
            Atajos para tareas operativas frecuentes del administrador.
          </p>
          <div className="admin-dashboard__quick-actions-grid">
            <Link className="btn primary admin-dashboard__quick-action" to="/subjects" style={{ textDecoration: 'none' }}>
              Gestionar materias
            </Link>
            <Link className="btn secondary admin-dashboard__quick-action" to="/absences" style={{ textDecoration: 'none' }}>
              Registrar asistencia
            </Link>
            <Link className="btn secondary admin-dashboard__quick-action" to="/observer" style={{ textDecoration: 'none' }}>
              Registrar observación
            </Link>
            <Link className="btn secondary admin-dashboard__quick-action" to="/messages" style={{ textDecoration: 'none' }}>
              Revisar mensajes
            </Link>
          </div>
        </section>
      </div>
      <SidebarBanner />
    </div>
  )
}
