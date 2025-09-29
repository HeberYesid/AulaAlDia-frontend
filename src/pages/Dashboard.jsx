import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = ['#16a34a', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [mine, setMine] = useState([])

  useEffect(() => {
    async function run() {
      setLoading(true)
      try {
        if (user.role === 'TEACHER' || user.role === 'ADMIN') {
          const { data } = await api.get('/api/courses/subjects/')
          setSubjects(data)
        } else {
          const { data } = await api.get('/api/courses/my-enrollments/')
          setMine(data.enrollments || [])
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Cargando dashboard...
      </div>
    )
  }

  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return (
      <div className="fade-in">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">👨‍🏫 Panel de Profesor</h1>
            <p className="dashboard-subtitle">Gestiona tus materias y estudiantes</p>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', margin: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{subjects.length}</div>
              <div className="stat-label">📚 Materias</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{subjects.reduce((acc, s) => acc + (s.enrollments_count || 0), 0)}</div>
              <div className="stat-label">👥 Estudiantes</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>📋 Mis Materias</h2>
          <div className="data-table">
            <table className="table">
              <thead>
                <tr>
                  <th>📝 Código</th>
                  <th>📚 Nombre</th>
                  <th>👥 Estudiantes</th>
                  <th>⚡ Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.code}</strong></td>
                    <td>{s.name}</td>
                    <td>{s.enrollments_count || 0}</td>
                    <td>
                      <Link className="action-btn btn" to={`/subjects/${s.id}`}>
                        👁️ Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Student dashboard
  const total = mine.reduce((acc, e) => acc + (e.stats?.total || 0), 0)
  const green = mine.reduce((acc, e) => acc + (e.stats?.green || 0), 0)
  const yellow = mine.reduce((acc, e) => acc + (e.stats?.yellow || 0), 0)
  const red = mine.reduce((acc, e) => acc + (e.stats?.red || 0), 0)
  const avgGrade = mine.length > 0 ? mine.reduce((acc, e) => acc + (e.stats?.grade || 0), 0) / mine.length : 0
  
  const chartData = [
    { name: 'Verde', value: green },
    { name: 'Amarillo', value: yellow },
    { name: 'Rojo', value: red },
  ]

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🎓 Mi Dashboard</h1>
          <p className="dashboard-subtitle">Seguimiento de tu progreso académico</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{mine.length}</div>
          <div className="stat-label">📚 Materias</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">📝 Ejercicios</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgGrade.toFixed(1)}</div>
          <div className="stat-label">📊 Promedio</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{green}</div>
          <div className="stat-label">✅ Aprobados</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2>📋 Mis Materias</h2>
          <div className="data-table">
            <table className="table">
              <thead>
                <tr>
                  <th>📝 Código</th>
                  <th>📚 Materia</th>
                  <th>📊 Nota</th>
                  <th>🚦 Estado</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((e) => (
                  <tr key={e.enrollment_id}>
                    <td><strong>{e.subject_code}</strong></td>
                    <td>{e.subject_name}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: e.stats?.grade >= 3.0 ? 'var(--success)' : 
                               e.stats?.grade >= 2.0 ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {e.stats?.grade?.toFixed?.(2) || 'N/A'}
                      </span>
                    </td>
                    <td><StatusBadge status={e.stats?.semaphore} grade={e.stats?.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card">
          <h2>📈 Resumen Visual</h2>
          <div className="chart-container">
            <PieChart width={320} height={240}>
              <Pie data={chartData} cx={160} cy={120} innerRadius={50} outerRadius={90} dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
            <p className="notice">📊 Total de ejercicios completados: <strong>{total}</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
