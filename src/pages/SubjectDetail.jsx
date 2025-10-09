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
  const [success, setSuccess] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exercises, setExercises] = useState([])
  const [newExerciseName, setNewExerciseName] = useState('')
  const [showExerciseForm, setShowExerciseForm] = useState(false)

  async function loadAll() {
    setLoading(true)
    try {
      const [s, e, d, ex] = await Promise.all([
        api.get(`/api/courses/subjects/${id}/`),
        api.get(`/api/courses/subjects/${id}/enrollments/`),
        api.get(`/api/courses/subjects/${id}/dashboard/`),
        api.get(`/api/courses/exercises/?subject=${id}`),
      ])
      setSubject(s.data)
      setEnrollments(e.data)
      setDash(d.data)
      setExercises(ex.data)
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
    setSuccess('')
    try {
      await api.post(`/api/courses/subjects/${id}/enrollments/`, { student_email: email })
      setSuccess(`✅ Estudiante ${email} inscrito correctamente`)
      setEmail('')
      loadAll()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error al inscribir:', err.response?.data)
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.student_email?.[0] ||
                       err.response?.data?.non_field_errors?.[0] ||
                       'No se pudo inscribir el estudiante. Verifica permisos y correo.'
      setError(errorMsg)
    }
  }

  async function exportCSV() {
    setExporting(true)
    try {
      const response = await api.get(`/api/courses/subjects/${id}/export-csv/`, {
        responseType: 'blob'
      })
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${subject?.code || 'resultados'}_consolidado.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('No se pudo exportar el CSV. Verifica permisos.')
    } finally {
      setExporting(false)
    }
  }

  async function createExercise(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/api/courses/exercises/', {
        subject: id,
        name: newExerciseName,
        order: exercises.length
      })
      setSuccess(`✅ Ejercicio "${newExerciseName}" creado correctamente`)
      setNewExerciseName('')
      setShowExerciseForm(false)
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error al crear ejercicio:', err.response?.data)
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.name?.[0] ||
                       err.response?.data?.non_field_errors?.[0] ||
                       'No se pudo crear el ejercicio.'
      setError(errorMsg)
    }
  }

  async function deleteExercise(exerciseId, exerciseName) {
    if (!confirm(`¿Estás seguro de eliminar el ejercicio "${exerciseName}"? Esto eliminará todos los resultados asociados.`)) {
      return
    }
    try {
      await api.delete(`/api/courses/exercises/${exerciseId}/`)
      setSuccess(`✅ Ejercicio eliminado correctamente`)
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('No se pudo eliminar el ejercicio.')
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
          {success && <p className="notice" style={{ color: 'var(--success)' }}>{success}</p>}
          {error && <p className="notice" style={{ color: 'var(--danger)' }}>{error}</p>}
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

        <h3 style={{ marginTop: '2rem' }}>📝 Ejercicios ({exercises.length})</h3>
        
        {!showExerciseForm ? (
          <button 
            className="btn" 
            onClick={() => setShowExerciseForm(true)}
            style={{ marginBottom: '1rem' }}
          >
            ➕ Crear Ejercicio
          </button>
        ) : (
          <form onSubmit={createExercise} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <label>Nombre del Ejercicio</label>
            <input 
              type="text" 
              value={newExerciseName} 
              onChange={(e) => setNewExerciseName(e.target.value)} 
              placeholder="Ej: Ejercicio 1 - Ecuaciones Lineales"
              required 
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn" type="submit">✅ Crear</button>
              <button 
                className="btn secondary" 
                type="button"
                onClick={() => {
                  setShowExerciseForm(false)
                  setNewExerciseName('')
                  setError('')
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        )}

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {exercises.length === 0 ? (
            <p className="notice">No hay ejercicios creados aún. Crea el primero para empezar a cargar resultados.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, index) => (
                  <tr key={ex.id}>
                    <td>{index + 1}</td>
                    <td>{ex.name}</td>
                    <td>
                      <button 
                        className="btn secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                        onClick={() => deleteExercise(ex.id, ex.name)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
            <button 
              className="btn secondary" 
              onClick={exportCSV}
              disabled={exporting}
            >
              {exporting ? '⏳ Exportando...' : '📥 Exportar CSV'}
            </button>
          </>
        ) : (
          <p className="notice">Sin datos</p>
        )}
      </div>
    </div>
  )
}
