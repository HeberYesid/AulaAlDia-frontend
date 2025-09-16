import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/axios'
import CSVUpload from '../components/CSVUpload'
import StatusBadge from '../components/StatusBadge'

export default function SubjectDetail() {
  const { id } = useParams()
  const [subject, setSubject] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [email, setEmail] = useState('')
  const [dash, setDash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    setLoading(true)
    try {
      const [s, e, d] = await Promise.all([
        api.get(`/api/courses/subjects/${id}/`),
        api.get(`/api/courses/subjects/${id}/enrollments/`),
        api.get(`/api/courses/subjects/${id}/dashboard/`),
      ])
      setSubject(s.data)
      setEnrollments(e.data)
      setDash(d.data)
    } catch (err) {
      setError('No se pudo cargar la información de la materia.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  async function addEnrollment(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/api/courses/subjects/${id}/enrollments/`, { student_email: email })
      setEmail('')
      loadAll()
    } catch (err) {
      setError('No se pudo inscribir el estudiante. Verifica permisos y correo.')
    }
  }

  if (loading) return <div className="card">Cargando...</div>
  if (!subject) return <div className="card">Materia no encontrada</div>

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>{subject.code} - {subject.name}</h2>
        <p className="notice">Profesor: {subject.teacher?.email}</p>

        <h3>Inscripciones</h3>
        <form onSubmit={addEnrollment} style={{ marginBottom: '.5rem' }}>
          <label>Correo del estudiante</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn" type="submit" style={{ marginTop: '.5rem' }}>Inscribir</button>
          {error && <p className="notice">{error}</p>}
        </form>

        <CSVUpload
          label="Cargar estudiantes (CSV con columnas: email, first_name, last_name)"
          uploadUrl={`/api/courses/subjects/${id}/enrollments/upload-csv/`}
          onComplete={loadAll}
        />

        <table className="table">
          <thead>
            <tr>
              <th>Correo</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td>{e.student.email}</td>
                <td>{e.student.first_name} {e.student.last_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Resultados</h3>
        <CSVUpload
          label="Cargar resultados (CSV con columnas: student_email, exercise_name, status)"
          uploadUrl={`/api/courses/subjects/${id}/results/upload-csv/`}
          onComplete={loadAll}
        />

        <h3>Dashboard</h3>
        {dash ? (
          <>
            <p className="notice">Ejercicios: {dash.total_exercises}</p>
            <table className="table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Total</th>
                  <th>Verde</th>
                  <th>Amarillo</th>
                  <th>Rojo</th>
                  <th>Nota</th>
                  <th>Semáforo</th>
                </tr>
              </thead>
              <tbody>
                {dash.enrollments.map((i) => (
                  <tr key={i.enrollment_id}>
                    <td>{i.student_email}</td>
                    <td>{i.total}</td>
                    <td>{i.green}</td>
                    <td>{i.yellow}</td>
                    <td>{i.red}</td>
                    <td>{i.grade}</td>
                    <td><StatusBadge status={i.semaphore} grade={i.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="notice">Promedio: {dash.aggregates?.avg_grade} | Verde: {dash.aggregates?.pct_green}% | Amarillo: {dash.aggregates?.pct_yellow}% | Rojo: {dash.aggregates?.pct_red}%</p>
            <a className="btn secondary" href={`/api/courses/subjects/${id}/export-csv/`} target="_blank" rel="noreferrer">Exportar CSV</a>
          </>
        ) : (
          <p className="notice">Sin datos</p>
        )}
      </div>
    </div>
  )
}
