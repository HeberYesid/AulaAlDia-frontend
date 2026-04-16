import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import WelcomePanel from '../components/WelcomePanel'
import SchoolHeader from '../components/SchoolHeader'
import SidebarBanner from '../components/SidebarBanner'
import { useAuth } from '../state/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showTutorNotice, setShowTutorNotice] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/courses/student-dashboard/')
      setDashboard(response.data)
    } catch (err) {
      console.error('Error loading dashboard:', err)

      if (err.response?.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' },
        })
        return
      }

      if (err.message === 'Network Error') {
        setError('No se pudo cargar tu dashboard porque no hay conexion con el servidor. Revisa tu internet e intentalo de nuevo.')
        return
      }

      setError(getApiErrorMessage(err, {
        action: 'cargar tu dashboard',
        fallback: 'No se pudo cargar tu dashboard academico. Intentalo nuevamente en unos minutos.',
      }))
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    loadDashboard()

    // Si no tiene acudiente
    if (user?.role === 'STUDENT' && !user.tutor_email) {
      setShowTutorNotice(true)
    }
  }, [loadDashboard, user])

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <span>Cargando dashboard…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="container">
        <div className="card">
          <p className="student-dashboard__error-text">{error || 'No se pudo cargar tu dashboard academico en este momento.'}</p>
        </div>
      </div>
    )
  }

  const { summary, subjects_progress, pending_exercises, recent_results } = dashboard

  return (
    <div className="fade-in student-dashboard">
      <SchoolHeader />

      {/* Notificación para Añadir Acudiente */}
      {showTutorNotice && (
        <div className="student-dashboard__notice">
          <div>
            <h3 className="student-dashboard__notice-title">
              ¡Añade a tu acudiente!
            </h3>
            <p className="student-dashboard__notice-copy">
              Aún no tienes un acudiente vinculado. Te recomendamos{' '}
              <Link to="/profile#tutor-invite-section" className="student-dashboard__notice-link">
                añadirlo en tu perfil
              </Link>{' '}
              para que pueda acompañarte en tu proceso académico.
            </p>
          </div>
        </div>
      )}

      {/* Mis Materias */}
      <div className="student-dashboard__section-gap">
        <h2 className="student-dashboard__section-title">
          Mis Materias
        </h2>

        {subjects_progress.length === 0 ? (
          <div className="card student-dashboard__empty-state">
            <p>No estás inscrito en ninguna materia</p>
          </div>
        ) : (
          <div className="subjects-grid-responsive">
            {subjects_progress.map((subject) => (
              <Link
                key={subject.subject_id}
                to={`/subjects/${subject.subject_id}`}
                className="card student-dashboard__subject-link"
              >
                {/* Header de la materia */}
                <div className="subject-header-responsive student-dashboard__subject-header">
                  <div className="student-dashboard__subject-content">
                    <h3 className="student-dashboard__subject-title">
                      {subject.subject_name}
                    </h3>
                    {(subject.total_absences > 0) && (
                      <div className="student-dashboard__absence-summary">
                        <span className="student-dashboard__absence-value">
                          {subject.total_absences} {subject.total_absences === 1 ? 'falta' : 'faltas'}
                        </span>
                        {subject.unjustified_absences > 0 && (
                          <span className="student-dashboard__absence-muted">
                            ({subject.unjustified_absences} sin justificar)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Grid de 2 columnas para Ejercicios Pendientes y Últimos Resultados */}
      <div className="exercises-grid-responsive">
        {/* Ejercicios Pendientes */}
        <div className="card">
          <h2 className="student-dashboard__card-title">Ejercicios Pendientes</h2>

          {pending_exercises.length === 0 ? (
            <div className="student-dashboard__empty-state">
              <p>¡No tienes ejercicios pendientes!</p>
            </div>
          ) : (
            <div className="student-dashboard__list-grid">
              {pending_exercises.map((exercise) => (
                <Link
                  key={exercise.id}
                  to={`/subjects/${exercise.subject_id}/exercises/${exercise.id}`}
                  className="student-dashboard__pending-item"
                >
                  <div className="student-dashboard__pending-name">
                    {exercise.name}
                  </div>
                  <div className="student-dashboard__pending-meta">
                    {exercise.subject_name} <span className="student-dashboard__pending-code">({exercise.subject_code})</span>
                  </div>
                  {exercise.deadline ? (
                    <div className="student-dashboard__deadline-chip">
                      Entrega: {exercise.deadline}
                    </div>
                  ) : (
                    <div className="student-dashboard__deadline-empty">
                      Sin fecha límite
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Últimos Resultados */}
        <div className="card">
          <h2 className="student-dashboard__card-title">Últimos Resultados</h2>

          {recent_results.length === 0 ? (
            <div className="student-dashboard__empty-state">
              <p>No tienes resultados aún</p>
            </div>
          ) : (
            <div className="student-dashboard__list-grid">
              {recent_results.map((result) => (
                <div
                  key={result.id}
                  className="student-dashboard__result-card"
                >
                  <div className="student-dashboard__result-head">
                    <div className="student-dashboard__result-name">
                      {result.exercise_name}
                    </div>
                    <span className={`badge student-dashboard__result-badge ${result.status === 'SUBMITTED' ? 'SUBMITTED' : result.score != null ? 'SCORE' : 'PENDING'}`}>
                      {result.status === 'SUBMITTED' ? 'Entregado' : result.score != null ? `Nota ${Number(result.score).toFixed(2)}` : 'Pendiente'}
                    </span>
                  </div>
                  <div className="student-dashboard__result-subject">
                    {result.subject_name}
                  </div>
                  {result.comment && (
                    <div className="student-dashboard__result-comment">
                      {result.comment}
                    </div>
                  )}
                  <div className="student-dashboard__result-date">
                    {result.created_at}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WelcomePanel />
      <SidebarBanner />
    </div>
  )
}
