import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import StudentDashboard from './StudentDashboard'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Si es estudiante, mostrar StudentDashboard
  if (user.role === 'STUDENT') {
    return <StudentDashboard />
  }

  async function loadSubjects() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/courses/subjects/')
      setSubjects(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [user])

  async function deleteSubject(subject) {
    const confirmMessage = `¿Estás seguro de que deseas eliminar la materia "${subject.name}" (${subject.code})?\n\nEsta acción eliminará:\n- Todos los estudiantes inscritos\n- Todos los ejercicios\n- Todos los resultados\n\nEsta acción NO se puede deshacer.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/courses/subjects/${subject.id}/`)
      setSuccess(`Materia "${subject.name}" eliminada exitosamente`)
      loadSubjects()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting subject:', err)
      setError(`No se pudo eliminar la materia: ${err.response?.data?.detail || err.message}`)
    }
  }

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
        {/* Mensajes de éxito/error */}
        {success && (
          <div className="alert success" style={{ marginBottom: 'var(--space-lg)' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="alert error" style={{ marginBottom: 'var(--space-lg)' }}>
            {error}
          </div>
        )}

        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {user.role === 'ADMIN' ? 'Panel de Administrador' : 'Panel de Profesor'}
            </h1>
            <p className="dashboard-subtitle">
              {user.role === 'ADMIN' ? 'Acceso completo al sistema' : 'Gestiona tus materias y estudiantes'}
            </p>
          </div>
          <div className="stats-grid grid-stack-mobile" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', margin: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{subjects.length}</div>
              <div className="stat-label">Materias</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{subjects.reduce((acc, s) => acc + (s.enrollments_count || 0), 0)}</div>
              <div className="stat-label">Estudiantes</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Mis Materias</h2>
          <div className="data-table">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estudiantes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Código"><strong>{s.code}</strong></td>
                    <td data-label="Nombre">{s.name}</td>
                    <td data-label="Estudiantes">{s.enrollments_count || 0}</td>
                    <td data-label="Acciones">
                      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                        <Link 
                          className="btn secondary" 
                          to={`/subjects/${s.id}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          Ver Detalles
                        </Link>
                        <button
                          onClick={() => deleteSubject(s)}
                          className="btn danger"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          Eliminar
                        </button>
                      </div>
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
}
