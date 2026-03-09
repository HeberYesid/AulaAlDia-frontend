import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import StudentDashboard from './StudentDashboard'
import Alert from '../components/Alert'
import WelcomePanel from '../components/WelcomePanel'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)

  async function loadSubjects() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/courses/subjects/')
      setSubjects(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.role === 'STUDENT') {
      return
    }
    loadSubjects()
  }, [user])

  // Si es estudiante, mostrar StudentDashboard
  if (user.role === 'STUDENT') {
    return <StudentDashboard />
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function deleteSubject(subject) {
    setConfirmDialog({
      title: `Eliminar materia "${subject.name}"`,
      message: `Esta acción eliminará todos los estudiantes inscritos, ejercicios y resultados de "${subject.name}" (${subject.code}). Esta acción NO se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(null)
        setError('')
        setSuccess('')
        try {
          await api.delete(`/api/v1/courses/subjects/${subject.id}/`)
          setSuccess(`Materia "${subject.name}" eliminada exitosamente`)
          loadSubjects()
          setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
          console.error('Error deleting subject:', err)
          setError(`No se pudo eliminar la materia: ${err.response?.data?.detail || err.message}`)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" role="status" aria-label="Cargando dashboard..."></div>
        <span aria-hidden="true">Cargando dashboard...</span>
      </div>
    )
  }

  if (user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'TUTOR') {
    return (
      <>
      <div className="fade-in">
        {/* Mensajes de éxito/error */}
        <Alert type="success" message={success} />
        <Alert type="error" message={error} />

        {user.role !== 'TEACHER' && (
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                {user.role === 'ADMIN' ? 'Panel de Administrador' : 'Panel de Acudiente'}
              </h1>
              <p className="dashboard-subtitle">
                {user.role === 'ADMIN' ? 'Acceso completo al sistema' : 'Monitorea el progreso de estudiantes vinculados'}
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
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2>{user.role === 'TUTOR' ? 'Materias Vinculadas' : 'Mis Materias'}</h2>
            {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
              <Link to="/subjects" className="btn primary" style={{ textDecoration: 'none' }}>
                Nueva Materia
              </Link>
            )}
          </div>

          {subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>{user.role === 'TUTOR' ? 'No hay materias vinculadas' : 'No tienes materias creadas'}</h3>
              <p>{user.role === 'TUTOR' ? 'Solicita al administrador vincular estudiantes a tu cuenta de acudiente.' : 'Comienza creando tu primera materia para gestionar estudiantes y ejercicios'}</p>
              {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                <Link to="/subjects" className="btn primary" style={{ marginTop: 'var(--space-md)' }}>
                  Crear mi primera materia
                </Link>
              )}
            </div>
          ) : (
            <div className="data-table">
              <table className="table mobile-card-view">
                <caption className="sr-only">Lista de materias</caption>
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Estudiantes</th>
                    <th scope="col">Acciones</th>
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
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none' }}
                          >
                            Ver Detalles
                          </Link>
                          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                            <button
                              onClick={() => deleteSubject(s)}
                              className="btn danger"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <WelcomePanel />
      </div>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      </>
    )
  }
}
