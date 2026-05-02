import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import SchoolHeader from '../components/SchoolHeader'
import SidebarBanner from '../components/SidebarBanner'
import StatCard from '../components/StatCard'
import useAdminDashboardData from '../hooks/useAdminDashboardData'

function toDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const {
    loading,
    error,
    blockErrors,
    academicSettings,
    absencesInActivePeriod,
    observationsInActivePeriod,
    kpis,
    performanceList,
    nextDeadline,
    openPeriodsSummary,
    upcomingEvents,
    criticalNotifications,
  } = useAdminDashboardData()

  const handleCardClick = (path) => {
    navigate(path)
  }

  const handleCardKeyDown = (event, path) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleCardClick(path)
  }

  const statsItems = [
    { label: 'Materias', value: kpis.subjectsCount },
    { label: 'Estudiantes', value: kpis.studentsCount },
    { label: 'Profesores', value: kpis.teachersCount },
    { label: 'Año académico actual', value: kpis.currentAcademicYear },
    { label: 'Período académico actual', value: kpis.currentAcademicPeriodLabel },
  ]

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

      <div className="stats-grid admin-dashboard__stats-grid">
        {statsItems.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
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
          <h2 className="admin-dashboard__section-title">Promedio por materia</h2>
          {blockErrors.performance && <Alert type="error" message={blockErrors.performance} />}
          {performanceList.length === 0 ? (
            <p className="admin-dashboard__muted">No hay métricas disponibles aún.</p>
          ) : (
            <div className="data-table admin-dashboard__table">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Materia</th>
                    <th scope="col">Promedio notas</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceList.map((item) => (
                    <tr key={item.subjectId}>
                      <td data-label="Materia">
                        <strong>{item.subjectName}</strong>
                      </td>
                      <td data-label="Promedio notas">{item.avgGrade.toFixed(2)}</td>
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
            <Link className="btn primary admin-dashboard__quick-action" to="/subjects">
              Gestionar materias
            </Link>
            <Link className="btn secondary admin-dashboard__quick-action" to="/absences">
              Registrar asistencia
            </Link>
            <Link className="btn secondary admin-dashboard__quick-action" to="/observer">
              Registrar observación
            </Link>
            <Link className="btn secondary admin-dashboard__quick-action" to="/messages">
              Revisar mensajes
            </Link>
          </div>
        </section>
      </div>
      <SidebarBanner />
    </div>
  )
}
