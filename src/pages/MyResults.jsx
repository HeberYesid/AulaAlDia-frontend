import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'

export default function MyResults() {
  const [enrs, setEnrs] = useState([])
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('name') // name, grade, status

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/courses/my-enrollments/')
      setEnrs(data.enrollments || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function openDetails(enrollmentId) {
    setSelected(enrollmentId)
    setDetails(null)
    const { data } = await api.get(`/api/courses/enrollments/${enrollmentId}/results/`)
    setDetails(data)
  }

  // Calcular estadísticas generales
  const globalStats = useMemo(() => {
    if (enrs.length === 0) return null
    
    let totalGreen = 0, totalYellow = 0, totalRed = 0, totalExercises = 0
    let sumGrades = 0
    let materiasConNotas = 0
    
    enrs.forEach(e => {
      if (e.stats?.grade != null) {
        sumGrades += e.stats.grade
        materiasConNotas++
      }
      if (e.stats) {
        totalGreen += e.stats.green_count || 0
        totalYellow += e.stats.yellow_count || 0
        totalRed += e.stats.red_count || 0
        totalExercises += e.stats.total_exercises || 0
      }
    })
    
    const avgGrade = materiasConNotas > 0 ? (sumGrades / materiasConNotas).toFixed(2) : 0
    const successRate = totalExercises > 0 ? ((totalGreen / totalExercises) * 100).toFixed(1) : 0
    
    return {
      totalMaterias: enrs.length,
      totalGreen,
      totalYellow,
      totalRed,
      totalExercises,
      avgGrade,
      successRate
    }
  }, [enrs])

  // Filtrar y ordenar materias
  const filteredEnrs = useMemo(() => {
    let filtered = [...enrs]
    
    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filtro por semáforo
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(e => e.stats?.semaphore === statusFilter)
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.subject_name.localeCompare(b.subject_name)
      } else if (sortBy === 'grade') {
        return (b.stats?.grade || 0) - (a.stats?.grade || 0)
      } else if (sortBy === 'status') {
        const order = { 'GREEN': 0, 'YELLOW': 1, 'RED': 2 }
        return order[a.stats?.semaphore || 'RED'] - order[b.stats?.semaphore || 'RED']
      }
      return 0
    })
    
    return filtered
  }, [enrs, searchTerm, statusFilter, sortBy])

  // Exportar resultados a CSV
  async function exportToCSV() {
    try {
      const csv = []
      csv.push(['Código', 'Materia', 'Nota', 'Semáforo', 'Total Ejercicios', 'Verdes', 'Amarillos', 'Rojos'])
      
      enrs.forEach(e => {
        csv.push([
          e.subject_code,
          e.subject_name,
          e.stats?.grade?.toFixed(2) || 'N/A',
          e.stats?.semaphore || 'N/A',
          e.stats?.total_exercises || 0,
          e.stats?.green_count || 0,
          e.stats?.yellow_count || 0,
          e.stats?.red_count || 0
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


      {/* Layout responsive: lista completa cuando no hay selección, split cuando hay detalles */}
      <div className="grid-stack-mobile" style={{ 
        display: 'grid',
        gridTemplateColumns: selected && details ? '1fr 1.2fr' : '1fr',
        gap: 'var(--space-lg)',
        transition: 'grid-template-columns 0.3s ease'
      }}>
      <div className="card">
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Mis Materias</h2>
          
          {/* Filtros y búsqueda */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-md)'
          }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 'var(--font-size-sm)' }}>🔍 Buscar</label>
              <input
                type="text"
                placeholder="Nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: 'var(--font-size-sm)' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 'var(--font-size-sm)' }}>Filtrar por estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="ALL">Todos</option>
                <option value="GREEN">Aprobado</option>
                <option value="YELLOW">Suficiente</option>
                <option value="RED">Reprobado</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 'var(--font-size-sm)' }}>Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="name">Nombre</option>
                <option value="grade">Nota (mayor a menor)</option>
                <option value="status">Estado (mejor a peor)</option>
              </select>
            </div>
          </div>

          {filteredEnrs.length !== enrs.length && (
            <p className="notice" style={{ margin: '0 0 var(--space-md) 0' }}>
              Mostrando {filteredEnrs.length} de {enrs.length} materias
            </p>
          )}
        </div>

        {filteredEnrs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', margin: 0 }}>🔍</p>
            <p>No se encontraron materias con los filtros aplicados</p>
          </div>
        ) : (
          <div className="table-container" style={{ maxHeight: selected && details ? '600px' : 'none', overflowY: 'auto' }}>
            <table className="table mobile-card-view">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Código</th>
              <th style={{ width: '40%' }}>Materia</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Nota</th>
              <th style={{ width: '18%', textAlign: 'center' }}>Estado</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrs.map((e) => (
              <tr key={e.enrollment_id} style={{ cursor: 'pointer' }} onClick={() => openDetails(e.enrollment_id)}>
                <td data-label="Código"><strong>{e.subject_code}</strong></td>
                <td data-label="Materia">{e.subject_name}</td>
                <td data-label="Nota" style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                  {e.stats?.grade?.toFixed?.(2)}
                </td>
                <td data-label="Estado" style={{ textAlign: 'center' }}><StatusBadge status={e.stats?.semaphore} grade={e.stats?.grade} /></td>
                <td data-label="Acción" style={{ textAlign: 'center' }}>
                  <button 
                    className="btn secondary" 
                    onClick={(ev) => { ev.stopPropagation(); openDetails(e.enrollment_id); }}
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
        )}
      </div>

      {(selected && details) && (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0 }}>Detalle de Resultados</h2>
          <button 
            className="btn secondary"
            onClick={() => { setSelected(null); setDetails(null); }}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            ✕ Cerrar
          </button>
        </div>
        {details && (
          <>
            {/* Info del estudiante y materia */}
            <div style={{ 
              padding: 'var(--space-md)', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              border: '1px solid var(--border-primary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Estudiante</p>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{details.student_email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Nota Final</p>
                  <p style={{ 
                    margin: 0, 
                    fontWeight: 700, 
                    fontSize: 'var(--font-size-xl)',
                    color: details.stats?.semaphore === 'GREEN' ? 'var(--success)' : 
                           details.stats?.semaphore === 'YELLOW' ? 'var(--warning)' : 'var(--danger)'
                  }}>
                    {details.stats?.grade?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Mini estadísticas de la materia */}
              {details.stats && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                  gap: 'var(--space-sm)',
                  marginTop: 'var(--space-md)',
                  paddingTop: 'var(--space-md)',
                  borderTop: '1px solid var(--border-primary)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success)' }}>
                      {details.stats.green_count || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Verdes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--warning)' }}>
                      {details.stats.yellow_count || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Amarillos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--danger)' }}>
                      {details.stats.red_count || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Rojos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {details.stats.total_exercises || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Total</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabla de ejercicios */}
            <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              Ejercicios 
              <span style={{ 
                fontSize: 'var(--font-size-sm)', 
                padding: '0.25rem 0.5rem', 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'normal'
              }}>
                {details.results?.length || 0}
              </span>
            </h3>
            
            {details.results?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', margin: 0 }}></p>
                <p>No hay resultados registrados para esta materia</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Ejercicio</th>
                  <th style={{ width: '25%', textAlign: 'center' }}>Estado</th>
                  <th style={{ width: '25%', textAlign: 'center' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {details.results.map((r) => (
                  <tr key={r.exercise_id}>
                    <td data-label="Ejercicio"><strong>{r.exercise_name}</strong></td>
                    <td data-label="Estado" style={{ textAlign: 'center' }}><StatusBadge status={r.status} /></td>
                    <td data-label="Fecha" style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {new Date(r.updated_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            )}
          </>
        )}
      </div>
      )}
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
              <div className="stat-value" style={{ color: 'var(--success)' }}>{globalStats.totalGreen}</div>
              <div className="stat-label">Verdes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{globalStats.totalYellow}</div>
              <div className="stat-label">Amarillos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{globalStats.totalRed}</div>
              <div className="stat-label">Rojos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{globalStats.successRate}%</div>
              <div className="stat-label">Tasa de Éxito</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
