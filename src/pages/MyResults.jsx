import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const DEFAULT_PASSING_GRADE = 3

export default function MyResults() {
  const [enrs, setEnrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportError, setExportError] = useState('')

  const officialStatusMeta = {
    DRAFT: { label: 'Borrador', color: 'var(--text-muted)' },
    APPROVED: { label: 'Aprobado', color: 'var(--warning)' },
    ISSUED: { label: 'Emitido', color: 'var(--success)' },
  }

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

  const gradedSubjects = useMemo(() => {
    return enrs.filter((enrollment) => enrollment.stats?.grade != null)
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
      setExportError(getApiErrorMessage(err, {
        action: 'exportar tus resultados a CSV',
        fallback: 'No se pudo exportar tus resultados a CSV. Intentalo nuevamente en unos minutos.',
      }))
    }
  }

  async function downloadOfficialBulletin(bulletinId) {
    if (!bulletinId) return
    try {
      await api.get(`/api/v1/courses/my-bulletins/${bulletinId}/official-pdf/`, {
        responseType: 'blob',
      })
    } catch (err) {
      setExportError(getApiErrorMessage(err, {
        action: 'descargar el boletín oficial',
        fallback: 'No se pudo descargar el boletín oficial.',
      }))
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
      {exportError && (
        <div className="alert error" role="alert" aria-live="assertive" style={{ marginBottom: '1rem' }}>
          {exportError}
        </div>
      )}
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

      <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h2 style={{ margin: 0 }}>Detalle por materia</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
              Consulta tu nota final numérica y el avance por asignatura.
            </p>
          </div>
        </div>

        <div className="data-table">
          <table className="table mobile-card-view">
            <thead>
              <tr>
                <th scope="col">Materia</th>
                <th scope="col">Nota final</th>
                <th scope="col">Promedio ejercicios</th>
                <th scope="col">Progreso</th>
                <th scope="col">Faltas</th>
              </tr>
            </thead>
            <tbody>
              {enrs.map((enrollment) => {
                const stats = enrollment.stats || {}
                const grade = stats.grade
                const averageScore = stats.average_score
                const gradedCount = stats.graded_count || 0
                const totalExercises = stats.total_exercises || 0
                const totalAbsences = stats.total_absences || 0
                const unjustifiedAbsences = stats.unjustified_absences || 0
                const bulletinStatus = stats.bulletin_official_status
                const statusMeta = bulletinStatus ? officialStatusMeta[bulletinStatus] : null

                return (
                  <tr key={enrollment.enrollment_id}>
                    <td data-label="Materia">
                      <strong>{enrollment.subject_name}</strong>
                      {statusMeta && (
                        <div style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-xs)', color: statusMeta.color, fontWeight: 700 }}>
                          {statusMeta.label}
                        </div>
                      )}
                    </td>
                    <td data-label="Nota final">
                      {grade != null ? (
                        <StatusBadge
                          status={null}
                          grade={grade}
                          locked={false}
                        />
                      ) : (
                        <span className="notice">Sin nota final</span>
                      )}
                    </td>
                    <td data-label="Promedio ejercicios">
                      {averageScore != null ? (
                        <span style={{ color: Number(averageScore) >= DEFAULT_PASSING_GRADE ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {Number(averageScore).toFixed(2)}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td data-label="Progreso">
                      {gradedCount}/{totalExercises} calificados
                    </td>
                    <td data-label="Faltas">
                      {totalAbsences}
                      {unjustifiedAbsences > 0 ? ` (${unjustifiedAbsences} sin justificar)` : ''}
                      {stats.financial_hold_active && stats.financial_hold_message ? (
                        <div className="notice danger" style={{ marginTop: 'var(--space-xs)' }}>
                          {stats.financial_hold_message}
                        </div>
                      ) : null}
                      {stats.can_download_official_pdf && stats.bulletin_id ? (
                        <div style={{ marginTop: 'var(--space-xs)' }}>
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => downloadOfficialBulletin(stats.bulletin_id)}
                            aria-label="Descargar boletín oficial"
                          >
                            Descargar boletín oficial
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {gradedSubjects.length === 0 ? (
          <p className="notice" style={{ marginTop: 'var(--space-md)', marginBottom: 0 }}>
            Tus materias aún no tienen notas finales publicadas.
          </p>
        ) : null}
      </div>
    </div>
  )
}
