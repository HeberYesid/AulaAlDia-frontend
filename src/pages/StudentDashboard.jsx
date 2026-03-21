import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import WelcomePanel from '../components/WelcomePanel'
import SchoolHeader from '../components/SchoolHeader'
import { useAuth } from '../state/AuthContext'

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showTutorNotice, setShowTutorNotice] = useState(false)

  useEffect(() => {
    loadDashboard()
    
    // Si no tiene acudiente
    if (user?.role === 'STUDENT' && !user.tutor_email) {
      setShowTutorNotice(true)
    }
  }, [user])

  async function loadDashboard() {
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
        setError('No se pudo conectar con el servidor para cargar el dashboard.')
        return
      }

      setError(err.response?.data?.detail || 'No se pudo cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }

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
          <p style={{ color: 'var(--danger)' }}>{error || 'Error al cargar dashboard'}</p>
        </div>
      </div>
    )
  }

  const { summary, subjects_progress, pending_exercises, recent_results } = dashboard

  return (
    <div className="fade-in">
      <SchoolHeader />

      {/* Notificación para Añadir Acudiente */}
      {showTutorNotice && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '1.2rem' }}>
              ¡Añade a tu acudiente!
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Aún no tienes un acudiente vinculado. Te recomendamos{' '}
              <Link to="/profile#tutor-invite-section" style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'underline' }}>
                añadirlo en tu perfil
              </Link>{' '}
              para que pueda acompañarte en tu proceso académico.
            </p>
          </div>
        </div>
      )}

      {/* Mis Materias */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Mis Materias
        </h2>

        {subjects_progress.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
            <p>No estás inscrito en ninguna materia</p>
          </div>
        ) : (
          <div className="subjects-grid-responsive">
            {subjects_progress.map((subject) => (
              <Link
                key={subject.subject_id}
                to={`/subjects/${subject.subject_id}`}
                className="card"
                style={{
                  display: 'block',
                  padding: 'var(--space-xl)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = ''
                }}>
                {/* Header de la materia */}
                <div className="subject-header-responsive" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                      {subject.subject_name}
                    </h3>
                    {(subject.total_absences > 0) && (
                      <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          {subject.total_absences} {subject.total_absences === 1 ? 'falta' : 'faltas'}
                        </span>
                        {subject.unjustified_absences > 0 && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
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
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>Ejercicios Pendientes</h2>

          {pending_exercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p>¡No tienes ejercicios pendientes!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {pending_exercises.map((exercise) => (
                <Link
                  key={exercise.id}
                  to={`/subjects/${exercise.subject_id}`}
                  style={{
                    display: 'block',
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {exercise.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {exercise.subject_name} <span style={{ color: 'var(--text-muted)' }}>({exercise.subject_code})</span>
                  </div>
                  {exercise.deadline ? (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--warning)',
                      background: 'var(--bg-primary)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-block'
                    }}>
                      Entrega: {exercise.deadline}
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
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
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>Últimos Resultados</h2>

          {recent_results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p>No tienes resultados aún</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {recent_results.map((result) => (
                <div
                  key={result.id}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>
                      {result.exercise_name}
                    </div>
                    <span className={`badge ${result.status === 'SUBMITTED' ? 'SUBMITTED' : result.score != null ? 'SCORE' : 'PENDING'}`} style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600
                    }}>
                      {result.status === 'SUBMITTED' ? 'Entregado' : result.score != null ? `Nota ${Number(result.score).toFixed(2)}` : 'Pendiente'}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {result.subject_name}
                  </div>
                  {result.comment && (
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      marginTop: 'var(--space-sm)',
                      padding: 'var(--space-sm)',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--primary)'
                    }}>
                      {result.comment}
                    </div>
                  )}
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-primary)'
                  }}>
                    {result.created_at}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WelcomePanel />
    </div>
  )
}
