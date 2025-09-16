import { useEffect, useState } from 'react'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'

export default function MyResults() {
  const [enrs, setEnrs] = useState([])
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="card">Cargando...</div>

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Mis materias</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Materia</th>
              <th>Nota</th>
              <th>Semáforo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enrs.map((e) => (
              <tr key={e.enrollment_id}>
                <td>{e.subject_code}</td>
                <td>{e.subject_name}</td>
                <td>{e.stats?.grade?.toFixed?.(2)}</td>
                <td><StatusBadge status={e.stats?.semaphore} grade={e.stats?.grade} /></td>
                <td><button className="btn secondary" onClick={() => openDetails(e.enrollment_id)}>Ver detalles</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Detalle de resultados</h2>
        {!selected && <p className="notice">Selecciona una materia para ver el detalle.</p>}
        {details && (
          <>
            <p className="notice">Estudiante: {details.student_email}</p>
            <table className="table">
              <thead>
                <tr>
                  <th>Ejercicio</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {details.results.map((r) => (
                  <tr key={r.exercise_id}>
                    <td>{r.exercise_name}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{new Date(r.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="notice">Nota: {details.stats?.grade}</p>
          </>
        )}
      </div>
    </div>
  )
}
