import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/courses/student-dashboard/')
      setDashboard(response.data)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('No se pudo cargar el dashboard')
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
            <span>Cargando dashboard...</span>
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
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Mi Dashboard</h1>
        </div>
      </div>



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
              <div
                key={subject.subject_id}
                className="card"
                role="button"
                tabIndex={0}
                style={{
                  padding: 'var(--space-xl)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  height: '100%'
                }}
                onClick={() => navigate(`/subjects/${subject.subject_id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/subjects/${subject.subject_id}`) } }}
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
                  </div>
                </div>
              </div>
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
                <div
                  key={exercise.id}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onClick={() => navigate(`/subjects/${exercise.subject_id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/subjects/${exercise.subject_id}`) } }}
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
                </div>
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
                    <span className={`badge ${result.status}`} style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600
                    }}>
                      {result.status === 'GREEN' && 'Aprobado'}
                      {result.status === 'YELLOW' && 'Suficiente'}
                      {result.status === 'RED' && 'Reprobado'}
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
    </div>
  )
}
