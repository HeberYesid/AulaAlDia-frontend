import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'

export default function MyResults() {
  const navigate = useNavigate()
  const [enrs, setEnrs] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/courses/my-enrollments/')
      setEnrs(data.enrollments || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Calcular estadísticas generales
  const globalStats = useMemo(() => {
    if (enrs.length === 0) return null
    
    let totalGraded = 0, totalSubmitted = 0, totalExercises = 0
    let totalAverageScores = 0
    let materiasConPromedio = 0
    let sumGrades = 0
    let materiasConNotas = 0
    let totalAbsences = 0
    let unjustifiedAbsences = 0
    
    enrs.forEach(e => {
      if (e.stats?.grade != null) {
        sumGrades += e.stats.grade
        materiasConNotas++
      }
      if (e.stats) {
        totalGraded += e.stats.graded_count || 0
        totalSubmitted += e.stats.submitted_count || 0
        totalExercises += e.stats.total_exercises || 0
        if (e.stats.average_score != null) {
          totalAverageScores += e.stats.average_score
          materiasConPromedio++
        }
        totalAbsences += e.stats.total_absences || 0
        unjustifiedAbsences += e.stats.unjustified_absences || 0
      }
    })
    
    const avgGrade = materiasConNotas > 0 ? (sumGrades / materiasConNotas).toFixed(2) : 0
    const avgExerciseScore = materiasConPromedio > 0 ? (totalAverageScores / materiasConPromedio).toFixed(2) : 0
    
    return {
      totalMaterias: enrs.length,
      totalGraded,
      totalSubmitted,
      totalExercises,
      avgGrade,
      avgExerciseScore,
      totalAbsences,
      unjustifiedAbsences
    }
  }, [enrs])

  // Exportar resultados a CSV
  async function exportToCSV() {
    try {
      const csv = []
      csv.push(['Código', 'Materia', 'Nota Final', 'Promedio Ejercicios', 'Total Ejercicios', 'Calificados', 'Entregados'])
      
      enrs.forEach(e => {
        csv.push([
          e.subject_code,
          e.subject_name,
          e.stats?.grade?.toFixed(2) || 'N/A',
          e.stats?.average_score?.toFixed?.(2) || 'N/A',
          e.stats?.total_exercises || 0,
          e.stats?.graded_count || 0,
          e.stats?.submitted_count || 0
        ])
      })
      
      const csvContent = csv.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `mis_resultados_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error al exportar:', err)
      alert('Error al exportar los datos')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <span>Cargando resultados...</span>
        </div>
      </div>
    )
  }

  if (enrs.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
          <h2 style={{ margin: '1rem 0', color: 'var(--text-primary)' }}>No estás inscrito en ninguna materia</h2>
          <p>Contacta con tu profesor para que te inscriba en las materias correspondientes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">


      {/* Layout responsive: lista completa */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
      <div className="card">
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Mis Materias</h2>
        </div>

        <div className="table-container">
            <table className="table mobile-card-view">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Código</th>
              <th style={{ width: '40%' }}>Materia</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Nota</th>
              <th style={{ width: '18%', textAlign: 'center' }}>Promedio ejercicios</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {enrs.map((e) => (
              <tr key={e.enrollment_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/subjects/${e.subject_id}`)}>
                <td data-label="Código"><strong>{e.subject_code}</strong></td>
                <td data-label="Materia">{e.subject_name}</td>
                <td data-label="Nota" style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                  {e.stats?.grade?.toFixed?.(2)}
                </td>
                <td data-label="Promedio" style={{ textAlign: 'center' }}><StatusBadge status={null} grade={e.stats?.average_score} /></td>
                <td data-label="Acción" style={{ textAlign: 'center' }}>
                  <button 
                    className="btn secondary" 
                    onClick={(ev) => { ev.stopPropagation(); navigate(`/subjects/${e.subject_id}`); }}
                    style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-sm)' }}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      </div>

      {/* Header con estadísticas globales */}
      {globalStats && (
        <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', color: 'var(--text-primary)' }}>Mis Resultados</h1>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Resumen completo de tu rendimiento académico</p>
            </div>
            <button 
              className="btn secondary"
              onClick={exportToCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
            >
              Exportar CSV
            </button>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{globalStats.totalMaterias}</div>
              <div className="stat-label">Materias</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{globalStats.avgGrade}</div>
              <div className="stat-label">Nota Promedio</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{globalStats.totalGraded}</div>
              <div className="stat-label">Calificados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{globalStats.totalSubmitted}</div>
              <div className="stat-label">Entregados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{globalStats.avgExerciseScore}</div>
              <div className="stat-label">Promedio ejercicios</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{globalStats.totalExercises}</div>
              <div className="stat-label">Resultados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{globalStats.totalAbsences}</div>
              <div className="stat-label">Faltas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
