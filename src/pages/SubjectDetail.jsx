import { useEffect, useState, useMemo } from 'react'
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
  const [newExerciseDeadline, setNewExerciseDeadline] = useState('')
  const [newExerciseDescription, setNewExerciseDescription] = useState('')
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [activeTab, setActiveTab] = useState('students') // 'students', 'exercises', 'results'
  const [editingResult, setEditingResult] = useState(null) // {resultId, currentStatus, studentEmail, exerciseName}
  const [newStatus, setNewStatus] = useState('')
  const [detailedResults, setDetailedResults] = useState([])
  
  // Filtros y búsqueda
  const [studentSearch, setStudentSearch] = useState('')
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL', 'GREEN', 'YELLOW', 'RED'
  const [resultSearch, setResultSearch] = useState('')

  async function loadAll() {
    setLoading(true)
    try {
      const [s, e, d, ex, results] = await Promise.all([
        api.get(`/api/courses/subjects/${id}/`),
        api.get(`/api/courses/subjects/${id}/enrollments/`),
        api.get(`/api/courses/subjects/${id}/dashboard/`),
        api.get(`/api/courses/exercises/?subject=${id}`),
        api.get(`/api/courses/results/?subject=${id}`),
      ])
      setSubject(s.data)
      setEnrollments(e.data)
      setDash(d.data)
      setExercises(ex.data)
      setDetailedResults(results.data)
    } catch (err) {
      setError('No se pudo cargar la información de la materia.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  // Filtrado de estudiantes
  const filteredEnrollments = useMemo(() => {
    if (!studentSearch.trim()) return enrollments
    const search = studentSearch.toLowerCase()
    return enrollments.filter(e => 
      e.student.email.toLowerCase().includes(search) ||
      e.student.first_name.toLowerCase().includes(search) ||
      e.student.last_name.toLowerCase().includes(search) ||
      `${e.student.first_name} ${e.student.last_name}`.toLowerCase().includes(search)
    )
  }, [enrollments, studentSearch])

  // Filtrado de ejercicios
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exercises
    const search = exerciseSearch.toLowerCase()
    return exercises.filter(ex => ex.name.toLowerCase().includes(search))
  }, [exercises, exerciseSearch])

  // Filtrado de resultados
  const filteredResults = useMemo(() => {
    let filtered = detailedResults

    // Filtrar por estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Filtrar por búsqueda
    if (resultSearch.trim()) {
      const search = resultSearch.toLowerCase()
      filtered = filtered.filter(r => 
        r.student_email.toLowerCase().includes(search) ||
        r.exercise_name.toLowerCase().includes(search) ||
        (r.student_name && r.student_name.toLowerCase().includes(search))
      )
    }

    return filtered
  }, [detailedResults, statusFilter, resultSearch])

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
      const payload = {
        subject: id,
        name: newExerciseName,
        order: exercises.length
      }
      
      // Add optional fields if provided
      if (newExerciseDeadline) {
        payload.deadline = newExerciseDeadline
      }
      if (newExerciseDescription) {
        payload.description = newExerciseDescription
      }
      
      await api.post('/api/courses/exercises/', payload)
      setSuccess(`✅ Ejercicio "${newExerciseName}" creado correctamente`)
      setNewExerciseName('')
      setNewExerciseDeadline('')
      setNewExerciseDescription('')
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

  function openEditModal(result) {
    setEditingResult({
      resultId: result.id,
      currentStatus: result.status,
      studentEmail: result.student_email,
      exerciseName: result.exercise_name
    })
    setNewStatus(result.status)
    setError('')
  }

  function closeEditModal() {
    setEditingResult(null)
    setNewStatus('')
    setError('')
  }

  async function updateResultStatus(e) {
    e.preventDefault()
    if (!editingResult) return
    
    try {
      await api.patch(`/api/courses/results/${editingResult.resultId}/`, {
        status: newStatus
      })
      setSuccess(`✅ Resultado actualizado: ${editingResult.studentEmail} - ${editingResult.exerciseName} → ${newStatus}`)
      closeEditModal()
      loadAll()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Error al actualizar resultado:', err.response?.data)
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.status?.[0] ||
                       'No se pudo actualizar el resultado.'
      setError(errorMsg)
    }
  }

  if (loading) return <div className="card">Cargando...</div>
  if (!subject) return <div className="card">Materia no encontrada</div>

  return (
    <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{subject.code} - {subject.name}</h1>
            <p className="notice" style={{ margin: '0.5rem 0 0 0' }}>👨‍🏫 Profesor: {subject.teacher?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="stat-card" style={{ minWidth: '120px' }}>
              <div className="stat-value">{enrollments.length}</div>
              <div className="stat-label">👥 Estudiantes</div>
            </div>
            <div className="stat-card" style={{ minWidth: '120px' }}>
              <div className="stat-value">{exercises.length}</div>
              <div className="stat-label">📝 Ejercicios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="card" style={{ background: 'var(--success)', color: 'white', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="card" style={{ background: 'var(--danger)', color: 'white', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
          {error}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="card" style={{ padding: '0', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: activeTab === 'students' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'students' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'students' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            👥 Estudiantes ({enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: activeTab === 'exercises' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'exercises' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'exercises' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'exercises' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            📝 Ejercicios ({exercises.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: activeTab === 'results' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'results' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'results' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'results' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            📊 Resultados
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <div className="card">
          <h2>👥 Gestión de Estudiantes</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3>➕ Inscribir Estudiante Individual</h3>
            <form onSubmit={addEnrollment} style={{ maxWidth: '500px' }}>
              <label>Correo electrónico del estudiante</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="estudiante@ejemplo.com"
                required 
              />
              <button className="btn" type="submit" style={{ marginTop: '0.75rem', width: '100%' }}>
                ✅ Inscribir Estudiante
              </button>
            </form>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>📤 Carga Masiva de Estudiantes</h3>
            <CSVUpload
              label="Cargar estudiantes desde CSV (columnas: email, first_name, last_name)"
              uploadUrl={`/api/courses/subjects/${id}/enrollments/upload-csv/`}
              onComplete={loadAll}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📋 Lista de Estudiantes Inscritos ({enrollments.length})</h3>
            </div>
            
            {enrollments.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por email, nombre o apellido..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                {studentSearch && (
                  <p className="notice" style={{ marginTop: '0.5rem' }}>
                    Mostrando {filteredEnrollments.length} de {enrollments.length} estudiantes
                  </p>
                )}
              </div>
            )}

            {enrollments.length === 0 ? (
              <p className="notice">No hay estudiantes inscritos en esta materia. Inscribe al primero usando el formulario arriba.</p>
            ) : filteredEnrollments.length === 0 ? (
              <p className="notice">No se encontraron estudiantes que coincidan con "{studentSearch}"</p>
            ) : (
              <div className="data-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>📧 Correo</th>
                      <th>👤 Nombre Completo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((e, index) => (
                      <tr key={e.id}>
                        <td>{index + 1}</td>
                        <td>{e.student.email}</td>
                        <td>{e.student.first_name} {e.student.last_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="card">
          <h2>📝 Gestión de Ejercicios</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3>➕ Crear Nuevo Ejercicio</h3>
            {!showExerciseForm ? (
              <button 
                className="btn" 
                onClick={() => setShowExerciseForm(true)}
              >
                ➕ Crear Ejercicio
              </button>
            ) : (
              <form onSubmit={createExercise} style={{ maxWidth: '700px', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label><strong>Nombre del Ejercicio *</strong></label>
                  <input 
                    type="text" 
                    value={newExerciseName} 
                    onChange={(e) => setNewExerciseName(e.target.value)} 
                    placeholder="Ej: Ejercicio 1 - Ecuaciones Lineales"
                    required 
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label><strong>Descripción (Opcional)</strong></label>
                  <textarea 
                    value={newExerciseDescription} 
                    onChange={(e) => setNewExerciseDescription(e.target.value)} 
                    placeholder="Describe en qué consiste este ejercicio..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label><strong>Fecha Límite (Opcional)</strong></label>
                  <input 
                    type="datetime-local" 
                    value={newExerciseDeadline} 
                    onChange={(e) => setNewExerciseDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    💡 Define hasta cuándo los estudiantes pueden entregar este ejercicio
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn" type="submit" style={{ flex: 1 }}>
                    ✅ Crear Ejercicio
                  </button>
                  <button 
                    className="btn secondary" 
                    type="button"
                    onClick={() => {
                      setShowExerciseForm(false)
                      setNewExerciseName('')
                      setNewExerciseDeadline('')
                      setNewExerciseDescription('')
                      setError('')
                    }}
                    style={{ flex: 1 }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📋 Lista de Ejercicios ({exercises.length})</h3>
            </div>

            {exercises.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar ejercicio por nombre..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                {exerciseSearch && (
                  <p className="notice" style={{ marginTop: '0.5rem' }}>
                    Mostrando {filteredExercises.length} de {exercises.length} ejercicios
                  </p>
                )}
              </div>
            )}

            {exercises.length === 0 ? (
              <div className="notice" style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '3rem', margin: '0' }}>📝</p>
                <p style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem 0' }}>No hay ejercicios creados</p>
                <p style={{ margin: '0', color: 'var(--text-secondary)' }}>Crea el primer ejercicio para empezar a cargar resultados</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <p className="notice">No se encontraron ejercicios que coincidan con "{exerciseSearch}"</p>
            ) : (
              <div className="data-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>📚 Nombre del Ejercicio</th>
                      <th>📝 Descripción</th>
                      <th style={{ width: '180px' }}>📅 Fecha Límite</th>
                      <th style={{ width: '150px' }}>⚡ Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExercises.map((ex, index) => {
                      const getDeadlineBadge = () => {
                        if (!ex.deadline) return null
                        
                        const deadlineDate = new Date(ex.deadline)
                        const now = new Date()
                        const diffTime = deadlineDate - now
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        
                        let color = 'var(--success)'
                        let icon = '✅'
                        let text = `${diffDays} días`
                        
                        if (diffDays < 0) {
                          color = 'var(--danger)'
                          icon = '⚠️'
                          text = `Vencido hace ${Math.abs(diffDays)} días`
                        } else if (diffDays === 0) {
                          color = 'var(--danger)'
                          icon = '🔥'
                          text = 'Vence HOY'
                        } else if (diffDays <= 3) {
                          color = 'var(--warning)'
                          icon = '⏰'
                          text = `${diffDays} día${diffDays > 1 ? 's' : ''}`
                        }
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>
                              {deadlineDate.toLocaleDateString('es-CO', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span 
                              style={{ 
                                fontSize: '0.75rem', 
                                color, 
                                fontWeight: 'bold'
                              }}
                            >
                              {icon} {text}
                            </span>
                          </div>
                        )
                      }
                      
                      return (
                        <tr key={ex.id}>
                          <td><strong>{index + 1}</strong></td>
                          <td>
                            <strong>{ex.name}</strong>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {ex.description || <em>Sin descripción</em>}
                          </td>
                          <td>
                            {getDeadlineBadge() || <em style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin fecha límite</em>}
                          </td>
                          <td>
                            <button 
                              className="btn secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', width: '100%' }}
                              onClick={() => deleteExercise(ex.id, ex.name)}
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="card">
          <h2>📊 Resultados y Dashboard</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3>📤 Cargar Resultados desde CSV</h3>
            <CSVUpload
              label="Cargar resultados (columnas: student_email, exercise_name, status)"
              uploadUrl={`/api/courses/subjects/${id}/results/upload-csv/`}
              onComplete={loadAll}
            />
            <p className="notice" style={{ marginTop: '0.5rem' }}>
              💡 Los ejercicios se crean automáticamente si no existen al subir el CSV
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📈 Dashboard de Resultados</h3>
              {dash && dash.enrollments.length > 0 && (
                <button 
                  className="btn secondary" 
                  onClick={exportCSV}
                  disabled={exporting}
                >
                  {exporting ? '⏳ Exportando...' : '📥 Exportar CSV'}
                </button>
              )}
            </div>

            {dash && dash.enrollments.length > 0 ? (
              <>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '1.5rem' }}>
                  <div className="stat-card">
                    <div className="stat-value">{dash.total_exercises}</div>
                    <div className="stat-label">📝 Ejercicios</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{dash.aggregates?.avg_grade?.toFixed(2) || '0.0'}</div>
                    <div className="stat-label">📊 Promedio</div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--success)' }}>
                    <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.pct_green?.toFixed(0) || '0'}%</div>
                    <div className="stat-label" style={{ color: 'white' }}>🟢 Verde</div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--warning)' }}>
                    <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.pct_yellow?.toFixed(0) || '0'}%</div>
                    <div className="stat-label" style={{ color: 'white' }}>🟡 Amarillo</div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--danger)' }}>
                    <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.pct_red?.toFixed(0) || '0'}%</div>
                    <div className="stat-label" style={{ color: 'white' }}>🔴 Rojo</div>
                  </div>
                </div>

                <div className="data-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>👤 Estudiante</th>
                        <th>📝 Total</th>
                        <th>🟢 Verde</th>
                        <th>🟡 Amarillo</th>
                        <th>🔴 Rojo</th>
                        <th>📊 Nota</th>
                        <th>🚦 Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.enrollments.map((i) => (
                        <tr key={i.enrollment_id}>
                          <td><strong>{i.student_email}</strong></td>
                          <td>{i.total}</td>
                          <td>{i.green}</td>
                          <td>{i.yellow}</td>
                          <td>{i.red}</td>
                          <td><strong>{i.grade?.toFixed(2)}</strong></td>
                          <td><StatusBadge status={i.semaphore} grade={i.grade} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="notice" style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '3rem', margin: '0' }}>📊</p>
                <p style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem 0' }}>No hay resultados cargados</p>
                <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
                  Asegúrate de tener estudiantes inscritos y ejercicios creados, luego carga los resultados vía CSV
                </p>
              </div>
            )}

            {/* Detailed Results Table with Edit */}
            {detailedResults.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h3>✏️ Resultados Individuales (Editable) - {detailedResults.length} resultados</h3>
                <p className="notice" style={{ marginBottom: '1rem' }}>
                  Haz clic en "Editar" para cambiar el estado de cualquier resultado individual
                </p>

                {/* Filtros */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar por estudiante o ejercicio..."
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
                    style={{
                      flex: '1 1 300px',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      flex: '0 1 200px',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">🚦 Todos los estados</option>
                    <option value="GREEN">🟢 Verde</option>
                    <option value="YELLOW">🟡 Amarillo</option>
                    <option value="RED">🔴 Rojo</option>
                  </select>
                </div>

                {(resultSearch || statusFilter !== 'ALL') && (
                  <p className="notice" style={{ marginBottom: '1rem' }}>
                    Mostrando {filteredResults.length} de {detailedResults.length} resultados
                    {resultSearch && ` con búsqueda "${resultSearch}"`}
                    {statusFilter !== 'ALL' && ` filtrados por estado: ${statusFilter}`}
                  </p>
                )}

                {filteredResults.length === 0 ? (
                  <p className="notice">No se encontraron resultados con los filtros aplicados</p>
                ) : (
                  <div className="data-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
                        <tr>
                          <th>👤 Estudiante</th>
                          <th>📚 Ejercicio</th>
                          <th>🚦 Estado</th>
                          <th>📅 Actualizado</th>
                          <th>⚡ Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((result) => (
                          <tr key={result.id}>
                            <td>{result.student_email}</td>
                            <td>{result.exercise_name}</td>
                            <td>
                              <StatusBadge status={result.status} grade={result.status === 'GREEN' ? 5.0 : result.status === 'YELLOW' ? 3.0 : 1.0} />
                            </td>
                            <td>{new Date(result.updated_at).toLocaleString('es-CO')}</td>
                            <td>
                              <button
                                className="btn secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                                onClick={() => openEditModal(result)}
                              >
                                ✏️ Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {editingResult && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={closeEditModal}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '500px', 
              width: '100%',
              margin: '0',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>✏️ Editar Resultado</h2>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0' }}><strong>👤 Estudiante:</strong> {editingResult.studentEmail}</p>
              <p style={{ margin: '0.5rem 0' }}><strong>📚 Ejercicio:</strong> {editingResult.exerciseName}</p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Estado Actual:</strong>{' '}
                <StatusBadge 
                  status={editingResult.currentStatus} 
                  grade={editingResult.currentStatus === 'GREEN' ? 5.0 : editingResult.currentStatus === 'YELLOW' ? 3.0 : 1.0} 
                />
              </p>
            </div>

            <form onSubmit={updateResultStatus}>
              <label><strong>Nuevo Estado</strong></label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
                style={{ 
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px'
                }}
              >
                <option value="GREEN">🟢 Verde - Completado exitosamente</option>
                <option value="YELLOW">🟡 Amarillo - Con observaciones</option>
                <option value="RED">🔴 Rojo - No completado</option>
              </select>

              {error && (
                <p style={{ color: 'var(--danger)', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px' }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="submit" 
                  className="btn"
                  style={{ flex: 1 }}
                >
                  ✅ Guardar Cambios
                </button>
                <button 
                  type="button"
                  className="btn secondary"
                  onClick={closeEditModal}
                  style={{ flex: 1 }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
