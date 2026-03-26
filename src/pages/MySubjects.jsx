import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'

export default function MySubjects() {
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/v1/courses/my-enrollments/')
      .then(({ data }) => {
        if (!cancelled) setEnrollments(data.enrollments || [])
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las materias.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="fade-in">
      {loading && (
        <div className="card">
          <div className="loading" aria-live="polite">
            <div className="spinner"></div>
            <span>Cargando materias...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="card">
          <p className="notice" role="alert">{error}</p>
        </div>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
            <h2 style={{ margin: '1rem 0', color: 'var(--text-primary)' }}>No estás inscrito en ninguna materia</h2>
            <p>Contacta con tu profesor para que te inscriba en las materias correspondientes</p>
          </div>
        </div>
      )}

      {!loading && !error && enrollments.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card">
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h2 style={{ marginBottom: 'var(--space-md)' }}>Mis Materias</h2>
            </div>

            <div className="table-container">
              <table className="table mobile-card-view">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th style={{ textAlign: 'center' }}>Nota</th>
                    <th style={{ textAlign: 'center' }}>Promedio ejercicios</th>
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enr) => (
                    <tr key={enr.enrollment_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/subjects/${enr.subject_id}`)}>
                      <td data-label="Materia">{enr.subject_name}</td>
                      <td data-label="Nota" style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                        {enr.stats?.grade?.toFixed?.(2)}
                      </td>
                      <td data-label="Promedio" style={{ textAlign: 'center' }}><StatusBadge status={null} grade={enr.stats?.average_score} /></td>
                      <td data-label="Acción" style={{ textAlign: 'center' }}>
                        <button
                          className="btn secondary"
                          onClick={(ev) => { ev.stopPropagation(); navigate(`/subjects/${enr.subject_id}`) }}
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
      )}
    </div>
  )
}
