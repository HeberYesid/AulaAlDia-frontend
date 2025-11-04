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
      const response = await api.get('/api/courses/student-dashboard/')
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
          <h1 className="dashboard-title">📊 Mi Dashboard</h1>
          <p className="dashboard-subtitle">Resumen de tu progreso académico</p>
        </div>
      </div>

      {/* Resumen General */}
      <div className="stats-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.75rem',
        marginBottom: 'var(--space-xl)' 
      }}>
        <div className="stat-card" style={{ padding: 'var(--space-md)' }}>
          <div className="stat-value" style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {summary.total_results}
          </div>
          <div className="stat-label" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>📊 Total</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))', padding: 'var(--space-md)' }}>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {summary.green_count}
          </div>
          <div className="stat-label" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>🟢</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))', padding: 'var(--space-md)' }}>
          <div className="stat-value" style={{ color: 'var(--warning)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {summary.yellow_count}
          </div>
          <div className="stat-label" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>🟡</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.05))', padding: 'var(--space-md)' }}>
          <div className="stat-value" style={{ color: 'var(--danger)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {summary.red_count}
          </div>
          <div className="stat-label" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>🔴</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))', padding: 'var(--space-md)' }}>
          <div className="stat-value" style={{ color: 'var(--primary)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {summary.success_rate}%
          </div>
          <div className="stat-label" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>✅</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(156, 39, 176, 0.05))', padding: 'var(--space-md)' }}>
          <div className="stat-value" style={{ color: 'var(--text-accent)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {summary.total_pending}
          </div>
          <div className="stat-label" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>⏳</div>
        </div>
      </div>

      {/* Progreso por Materia */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          📚 Progreso por Materia
        </h2>
        
        {subjects_progress.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '3rem', margin: 0 }}>📭</p>
            <p>No estás inscrito en ninguna materia</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
            gap: 'var(--space-md)' 
          }}>
            {subjects_progress.map((subject) => (
              <div
                key={subject.subject_id}
                className="card"
                style={{
                  padding: 'var(--space-lg)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  height: '100%'
                }}
                onClick={() => navigate(`/subjects/${subject.subject_id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {/* Header de la materia */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: 0, fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 700, lineHeight: 1.3 }}>
                      {subject.subject_name}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      📋 {subject.subject_code}
                    </p>
                  </div>
                  <div style={{ 
                    textAlign: 'right',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    minWidth: '80px'
                  }}>
                    <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                      {subject.completion_rate}%
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: 'var(--bg-primary)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginBottom: '1.25rem',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    width: `${subject.completion_rate}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                    borderRadius: '999px',
                    transition: 'width 0.5s ease',
                    boxShadow: '0 0 8px rgba(25, 118, 210, 0.4)'
                  }} />
                </div>

                {/* Estadísticas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
                  gap: 'var(--space-sm)'
                }}>
                  <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 700, lineHeight: 1.2 }}>
                      {subject.completed_exercises}/{subject.total_exercises}
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      📝
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'rgba(76, 175, 80, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 700, color: 'var(--success)', lineHeight: 1.2 }}>
                      {subject.green_count}
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      🟢
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'rgba(255, 193, 7, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 700, color: 'var(--warning)', lineHeight: 1.2 }}>
                      {subject.yellow_count}
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      🟡
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'rgba(244, 67, 54, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 700, color: 'var(--danger)', lineHeight: 1.2 }}>
                      {subject.red_count}
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      🔴
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'rgba(25, 118, 210, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.2 }}>
                      {subject.success_rate}%
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      ✅
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid de 2 columnas para Ejercicios Pendientes y Últimos Resultados */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', 
        gap: 'var(--space-md)' 
      }}>
        {/* Ejercicios Pendientes */}
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>⏳ Ejercicios Pendientes</h2>
          
          {pending_exercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '3rem', margin: 0 }}>🎉</p>
              <p>¡No tienes ejercicios pendientes!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {pending_exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onClick={() => navigate(`/subjects/${exercise.subject_id}`)}
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
                    📝 {exercise.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    📚 {exercise.subject_name} <span style={{ color: 'var(--text-muted)' }}>({exercise.subject_code})</span>
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
                      ⏰ Entrega: {exercise.deadline}
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
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>🕐 Últimos Resultados</h2>
          
          {recent_results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '3rem', margin: 0 }}>📭</p>
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
                      {result.status === 'GREEN' && '🟢 Verde'}
                      {result.status === 'YELLOW' && '🟡 Amarillo'}
                      {result.status === 'RED' && '🔴 Rojo'}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    📚 {result.subject_name}
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
                      💬 {result.comment}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: 'var(--font-size-xs)', 
                    color: 'var(--text-muted)', 
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-primary)'
                  }}>
                    📅 {result.created_at}
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
