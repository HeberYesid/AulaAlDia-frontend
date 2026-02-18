import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import CSVUpload from '../components/CSVUpload'
import StatusBadge from '../components/StatusBadge'

export default function SubjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
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
  const [newExerciseFile, setNewExerciseFile] = useState(null)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  
  // Estados para editar ejercicio
  const [editingExercise, setEditingExercise] = useState(null) // {id, name, deadline, description}
  const [editExerciseName, setEditExerciseName] = useState('')
  const [editExerciseDeadline, setEditExerciseDeadline] = useState('')
  const [editExerciseDescription, setEditExerciseDescription] = useState('')
  const [editExerciseFile, setEditExerciseFile] = useState(null)
  
  const [activeTab, setActiveTab] = useState('students') // 'students', 'exercises', 'results'
  const [editingResult, setEditingResult] = useState(null) // {resultId, currentStatus, currentComment, studentEmail, exerciseName}
  const [newStatus, setNewStatus] = useState('')
  const [newComment, setNewComment] = useState('')
  const [detailedResults, setDetailedResults] = useState([])
  
  // Estados para crear resultado individual
  const [showCreateResultForm, setShowCreateResultForm] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [createStatus, setCreateStatus] = useState('GREEN')
  const [createComment, setCreateComment] = useState('')
  
  // Filtros y búsqueda
  const [studentSearch, setStudentSearch] = useState('')
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL', 'GREEN', 'YELLOW', 'RED'
  const [resultSearch, setResultSearch] = useState('')
  
  // Verificación de existencia de usuario
  const [userExistsStatus, setUserExistsStatus] = useState(null) // null, 'checking', 'exists', 'not-exists'
  const [userExistsInfo, setUserExistsInfo] = useState(null)

  // Estado para subida de archivos
  const [uploadingExercise, setUploadingExercise] = useState(null)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionText, setSubmissionText] = useState('')
  
  // Estado para ver solución de texto
  const [viewingSubmission, setViewingSubmission] = useState(null)

  // Estado para IA
  const [generatingAI, setGeneratingAI] = useState(false)

  async function generateAIFeedback() {
    if (!newStatus) {
      setError('Selecciona un estado primero para generar feedback acorde.')
      return
    }
    
    setGeneratingAI(true)
    setError('')
    
    try {
      // Buscar el ejercicio ID desde editingResult (que tiene exerciseName, pero necesitamos ID)
      // editingResult viene de detailedResults que tiene exercise_id
      // Vamos a buscar el resultado original en detailedResults
      const originalResult = detailedResults.find(r => r.id === editingResult.resultId)
      
      if (!originalResult) {
        throw new Error('No se encontró el resultado original')
      }

      const response = await api.post('/api/v1/courses/results/generate-ai-feedback/', {
        exercise_id: originalResult.exercise, // Corregido: el serializer devuelve 'exercise' como ID
        status: newStatus,
        current_comment: newComment || editingResult.currentComment,
        student_email: editingResult.studentEmail
      })
      
      setNewComment(response.data.feedback)
    } catch (err) {
      console.error(err)
      setError('Error al generar feedback con IA. Intenta de nuevo.')
    } finally {
      setGeneratingAI(false)
    }
  }

  async function generateAICreateFeedback() {
    if (!createStatus) {
      setError('Selecciona un estado primero para generar feedback acorde.')
      return
    }
    if (!selectedExerciseId) {
      setError('Selecciona un ejercicio primero.')
      return
    }
    if (!selectedEnrollmentId) {
      setError('Selecciona un estudiante primero.')
      return
    }
    
    setGeneratingAI(true)
    setError('')
    
    try {
      // Find student email
      const enrollment = enrollments.find(e => e.id == selectedEnrollmentId)
      const studentEmail = enrollment ? enrollment.student.email : ''

      const response = await api.post('/api/v1/courses/results/generate-ai-feedback/', {
        exercise_id: selectedExerciseId,
        status: createStatus,
        current_comment: createComment,
        student_email: studentEmail
      })
      
      setCreateComment(response.data.feedback)
    } catch (err) {
      console.error(err)
      setError('Error al generar feedback con IA. Intenta de nuevo.')
    } finally {
      setGeneratingAI(false)
    }
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [s, e, d, ex, results] = await Promise.all([
        api.get(`/api/v1/courses/subjects/${id}/`),
        api.get(`/api/v1/courses/subjects/${id}/enrollments/`),
        api.get(`/api/v1/courses/subjects/${id}/dashboard/`),
        api.get(`/api/v1/courses/exercises/?subject=${id}`),
        api.get(`/api/v1/courses/results/?subject=${id}`),
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

  // Establecer tab inicial basado en rol
  useEffect(() => {
    if (user?.role === 'STUDENT') {
      setActiveTab('results')
    }
  }, [user])

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

    // Si es estudiante, solo mostrar sus propios resultados
    if (user?.role === 'STUDENT' && user?.email) {
      filtered = filtered.filter(r => r.student_email === user.email)
    }

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
  }, [detailedResults, statusFilter, resultSearch, user])

  // Obtener estadísticas del estudiante actual
  const studentStats = useMemo(() => {
    if (user?.role !== 'STUDENT' || !dash?.enrollments) return null
    return dash.enrollments.find(e => e.student_email === user.email)
  }, [dash, user])

  // Verificar si el usuario existe en la plataforma
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!email || !email.includes('@')) {
        setUserExistsStatus(null)
        setUserExistsInfo(null)
        return
      }

      setUserExistsStatus('checking')
      
      try {
        const response = await api.get(`/api/v1/auth/check-user-exists/?email=${encodeURIComponent(email)}`)
        setUserExistsStatus('exists')
        setUserExistsInfo(response.data)
      } catch (err) {
        if (err.response?.status === 404) {
          setUserExistsStatus('not-exists')
          setUserExistsInfo(null)
        } else {
          setUserExistsStatus(null)
          setUserExistsInfo(null)
        }
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [email])

  async function addEnrollment(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post(`/api/v1/courses/subjects/${id}/enrollments/`, { student_email: email })
      setSuccess(`Estudiante ${email} inscrito correctamente`)
      setEmail('')
      setUserExistsStatus(null)
      setUserExistsInfo(null)
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
      const response = await api.get(`/api/v1/courses/subjects/${id}/export-csv/`, {
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
      const formData = new FormData()
      formData.append('subject', id)
      formData.append('name', newExerciseName)
      formData.append('order', exercises.length)
      
      if (newExerciseDeadline) {
        formData.append('deadline', newExerciseDeadline)
      }
      if (newExerciseDescription) {
        formData.append('description', newExerciseDescription)
      }
      if (newExerciseFile) {
        formData.append('attachment', newExerciseFile)
      }
      
      await api.post('/api/v1/courses/exercises/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(`Ejercicio "${newExerciseName}" creado correctamente`)
      setNewExerciseName('')
      setNewExerciseDeadline('')
      setNewExerciseDescription('')
      setNewExerciseFile(null)
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
      await api.delete(`/api/v1/courses/exercises/${exerciseId}/`)
      setSuccess(`Ejercicio eliminado correctamente`)
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('No se pudo eliminar el ejercicio.')
    }
  }

  function openEditExerciseModal(exercise) {
    setEditingExercise(exercise)
    setEditExerciseName(exercise.name)
    setEditExerciseDeadline(exercise.deadline || '')
    setEditExerciseDescription(exercise.description || '')
    setError('')
    setSuccess('')
  }

  function closeEditExerciseModal() {
    setEditingExercise(null)
    setEditExerciseName('')
    setEditExerciseDeadline('')
    setEditExerciseDescription('')
    setEditExerciseFile(null)
    setError('')
  }

  async function updateExercise(e) {
    e.preventDefault()
    if (!editingExercise) return
    
    if (!editExerciseName.trim()) {
      setError('El nombre del ejercicio es obligatorio')
      return
    }
    
    setError('')
    setSuccess('')
    
    try {
      const formData = new FormData()
      formData.append('name', editExerciseName.trim())
      if (editExerciseDeadline) {
        formData.append('deadline', editExerciseDeadline)
      } else {
        formData.append('deadline', '')
      }
      formData.append('description', editExerciseDescription.trim() || '')
      
      if (editExerciseFile) {
        formData.append('attachment', editExerciseFile)
      }
      
      await api.patch(`/api/v1/courses/exercises/${editingExercise.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(`Ejercicio "${editExerciseName}" actualizado correctamente`)
      closeEditExerciseModal()
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error al actualizar ejercicio:', err.response?.data)
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.name?.[0] ||
                       err.response?.data?.non_field_errors?.[0] ||
                       'No se pudo actualizar el ejercicio.'
      setError(errorMsg)
    }
  }

  function openEditModal(result) {
    setEditingResult({
      resultId: result.id,
      currentStatus: result.status,
      currentComment: result.comment || '',
      studentEmail: result.student_email,
      exerciseName: result.exercise_name,
      submissionText: result.submission_text,
      submissionFile: result.submission_file
    })
    setNewStatus(result.status)
    setNewComment(result.comment || '')
    setError('')
  }

  function closeEditModal() {
    setEditingResult(null)
    setNewStatus('')
    setNewComment('')
    setError('')
  }

  async function updateResultStatus(e) {
    e.preventDefault()
    if (!editingResult) return
    
    try {
      await api.patch(`/api/v1/courses/results/${editingResult.resultId}/`, {
        status: newStatus,
        comment: newComment
      })
      setSuccess(`Resultado actualizado: ${editingResult.studentEmail} - ${editingResult.exerciseName} → ${newStatus}`)
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

  function openCreateResultForm() {
    setShowCreateResultForm(true)
    setSelectedEnrollmentId('')
    setSelectedExerciseId('')
    setCreateStatus('GREEN')
    setCreateComment('')
    setError('')
    setSuccess('')
  }

  function closeCreateResultForm() {
    setShowCreateResultForm(false)
    setSelectedEnrollmentId('')
    setSelectedExerciseId('')
    setCreateStatus('GREEN')
    setCreateComment('')
    setError('')
  }

  async function createResult(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!selectedEnrollmentId || !selectedExerciseId) {
      setError('Debes seleccionar un estudiante y un ejercicio')
      return
    }
    
    try {
      await api.post('/api/v1/courses/results/', {
        enrollment: selectedEnrollmentId,
        exercise: selectedExerciseId,
        status: createStatus,
        comment: createComment
      })
      
      const enrollment = enrollments.find(e => e.id === parseInt(selectedEnrollmentId))
      const exercise = exercises.find(ex => ex.id === parseInt(selectedExerciseId))
      
      setSuccess(`Resultado asignado: ${enrollment?.student?.email} - ${exercise?.name} → ${createStatus}`)
      closeCreateResultForm()
      loadAll()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Error al crear resultado:', err.response?.data)
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.status?.[0] ||
                       'No se pudo crear el resultado.'
      setError(errorMsg)
    }
  }

  async function submitSolution(e) {
    e.preventDefault()
    if (!uploadingExercise) return
    
    if (!submissionFile && !submissionText) {
        setError('Debes subir un archivo o escribir una respuesta')
        return
    }
    
    if (submissionFile && submissionFile.size > 1024 * 1024) {
        setError('El archivo no puede superar 1MB')
        return
    }
    
    const formData = new FormData()
    if (submissionFile) formData.append('submission_file', submissionFile)
    if (submissionText) formData.append('submission_text', submissionText)
    
    try {
        await api.post(`/api/v1/courses/exercises/${uploadingExercise.id}/submit/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        setSuccess('Solución subida correctamente')
        setUploadingExercise(null)
        setSubmissionFile(null)
        setSubmissionText('')
        loadAll()
        setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
        console.error(err)
        setError(err.response?.data?.detail || 'Error al subir la solución')
    }
  }

  const studentExercisesList = useMemo(() => {
    if (user?.role !== 'STUDENT') return []
    
    return exercises.map(ex => {
      const result = detailedResults.find(r => r.exercise === ex.id)
      return {
        ...ex,
        result: result || null
      }
    })
  }, [exercises, detailedResults, user])

  if (loading) return <div className="card">Cargando...</div>
  if (!subject) return <div className="card">Materia no encontrada</div>

  return (
    <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{subject.code} - {subject.name}</h1>
            <p className="notice" style={{ margin: '0.5rem 0 0 0' }}>Profesor: {subject.teacher?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="stat-card" style={{ minWidth: '120px' }}>
              <div className="stat-value">{enrollments.length}</div>
              <div className="stat-label">Estudiantes</div>
            </div>
            <div className="stat-card" style={{ minWidth: '120px' }}>
              <div className="stat-value">{exercises.length}</div>
              <div className="stat-label">Ejercicios</div>
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
      {user?.role === 'STUDENT' ? (
        // Vista simplificada para estudiantes - sin tabs
        <>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--primary)', color: 'white' }}>
            <h2 style={{ margin: 0 }}>Resultados en {subject.name}</h2>
          </div>

          {studentStats && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Nota Final</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: studentStats.grade >= 3.0 ? 'var(--success)' : 'var(--danger)' }}>
                    {studentStats.grade?.toFixed(2)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{studentStats.green}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verdes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{studentStats.yellow}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amarillos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{studentStats.red}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rojos</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentStats.total}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // Vista completa para profesores/admin con tabs
        <div className="card" style={{ padding: '0', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div className="tabs-scrollable" style={{ display: 'flex', borderBottom: '2px solid var(--border)' }}>
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
              Estudiantes ({enrollments.length})
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
              Ejercicios ({exercises.length})
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
              Resultados
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'students' && (
        <div className="card">
          <h2>Gestión de Estudiantes</h2>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Lista de Estudiantes Inscritos ({enrollments.length})</h3>
            </div>
            
            {enrollments.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Buscar por email, nombre o apellido..."
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
              <p className="notice">No hay estudiantes inscritos en esta materia. Inscribe al primero usando el formulario abajo.</p>
            ) : filteredEnrollments.length === 0 ? (
              <p className="notice">No se encontraron estudiantes que coincidan con "{studentSearch}"</p>
            ) : (
              <div className="data-table">
                <table className="table mobile-card-view">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Correo</th>
                      <th>Nombre Completo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((e, index) => (
                      <tr key={e.id}>
                        <td data-label="#">{index + 1}</td>
                        <td data-label="Correo">{e.student.email}</td>
                        <td data-label="Nombre">{e.student.first_name} {e.student.last_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
            <h3>Inscribir Estudiante Individual</h3>
            <form onSubmit={addEnrollment} style={{ maxWidth: '500px' }}>
              <label htmlFor="enrollment-email">Correo electrónico del estudiante</label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="enrollment-email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="estudiante@ejemplo.com"
                  required
                  style={{
                    paddingRight: userExistsStatus ? '2.5rem' : undefined
                  }}
                />
                {userExistsStatus === 'checking' && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem'
                  }}>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  </div>
                )}
                {userExistsStatus === 'exists' && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    color: 'var(--success)'
                  }} title="Usuario encontrado">
                    ✓
                  </div>
                )}
                {userExistsStatus === 'not-exists' && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    color: 'var(--warning)'
                  }} title="Usuario no encontrado">
                    
                  </div>
                )}
              </div>
              
              {/* Información del usuario si existe */}
              {userExistsStatus === 'exists' && userExistsInfo && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid var(--success)',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.25rem' }}>
                    Usuario encontrado en la plataforma
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {userExistsInfo.first_name} {userExistsInfo.last_name}
                  </div>
                  {userExistsInfo.role && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Rol: {userExistsInfo.role === 'STUDENT' ? 'Estudiante' : userExistsInfo.role === 'TEACHER' ? 'Profesor' : 'Admin'}
                    </div>
                  )}
                </div>
              )}
              
              {/* Advertencia si el usuario no existe */}
              {userExistsStatus === 'not-exists' && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid var(--warning)',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--warning)', marginBottom: '0.25rem' }}>
                     Usuario no encontrado
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Se creará automáticamente una cuenta nueva con este correo. El estudiante deberá verificar su email para activarla.
                  </div>
                </div>
              )}
              
              <button className="btn" type="submit" style={{ marginTop: '0.75rem', width: '100%' }}>
                {userExistsStatus === 'exists' ? 'Inscribir Estudiante Existente' : 'Inscribir Estudiante'}
              </button>
            </form>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Carga Masiva de Estudiantes</h3>
            <CSVUpload
              label="Cargar estudiantes desde CSV (columnas: email, first_name, last_name)"
              uploadUrl={`/api/v1/courses/subjects/${id}/enrollments/upload-csv/`}
              onComplete={loadAll}
            />
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="card">
          <h2>Gestión de Ejercicios</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3>Crear Nuevo Ejercicio</h3>
            {!showExerciseForm ? (
              <button 
                className="btn" 
                onClick={() => setShowExerciseForm(true)}
              >
                Crear Ejercicio
              </button>
            ) : (
              <form onSubmit={createExercise} style={{ maxWidth: '700px', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="create-exercise-name"><strong>Nombre del Ejercicio *</strong></label>
                  <input 
                    id="create-exercise-name"
                    type="text" 
                    value={newExerciseName} 
                    onChange={(e) => setNewExerciseName(e.target.value)} 
                    placeholder="Ej: Ejercicio 1 - Ecuaciones Lineales"
                    required 
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="create-exercise-desc"><strong>Descripción (Opcional)</strong></label>
                  <textarea 
                    id="create-exercise-desc"
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
                  <label htmlFor="create-exercise-deadline"><strong>Fecha Límite (Opcional)</strong></label>
                  <input 
                    id="create-exercise-deadline"
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

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="create-exercise-file"><strong>Archivo Adjunto (Opcional)</strong></label>
                  <input 
                    id="create-exercise-file"
                    type="file" 
                    onChange={(e) => setNewExerciseFile(e.target.files[0])}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    💡 Sube un archivo guía para los estudiantes (PDF, DOCX, etc.)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn" type="submit" style={{ flex: 1 }}>
                    Crear Ejercicio
                  </button>
                  <button 
                    className="btn secondary" 
                    type="button"
                    onClick={() => {
                      setShowExerciseForm(false)
                      setNewExerciseName('')
                      setNewExerciseDeadline('')
                      setNewExerciseDescription('')
                      setNewExerciseFile(null)
                      setError('')
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Lista de Ejercicios ({exercises.length})</h3>
            </div>

            {exercises.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Buscar ejercicio por nombre..."
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
                <p style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem 0' }}>No hay ejercicios creados</p>
                <p style={{ margin: '0', color: 'var(--text-secondary)' }}>Crea el primer ejercicio para empezar a cargar resultados</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <p className="notice">No se encontraron ejercicios que coincidan con "{exerciseSearch}"</p>
            ) : (
              <div className="data-table">
                <table className="table mobile-card-view">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Nombre del Ejercicio</th>
                      <th>Descripción</th>
                      <th>Archivo</th>
                      <th style={{ width: '180px' }}>Fecha Límite</th>
                      <th style={{ width: '150px' }}>Acciones</th>
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
                        let icon = '✓'  // checkmark
                        let text = `${diffDays} días`
                        
                        if (diffDays < 0) {
                          color = 'var(--danger)'
                          icon = ''
                          text = `Vencido hace ${Math.abs(diffDays)} días`
                        } else if (diffDays === 0) {
                          color = 'var(--danger)'
                          icon = '🔥'
                          text = 'Vence HOY'
                        } else if (diffDays <= 3) {
                          color = 'var(--warning)'
                          icon = '✗'  // X mark
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
                          <td data-label="#"><strong>{index + 1}</strong></td>
                          <td data-label="Nombre">
                            <strong>{ex.name}</strong>
                          </td>
                          <td data-label="Descripción" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {ex.description || <em>Sin descripción</em>}
                          </td>
                          <td data-label="Archivo">
                            {ex.attachment ? (
                              <a href={ex.attachment} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)', textDecoration: 'underline'}}>
                                Descargar
                              </a>
                            ) : (
                              <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>-</span>
                            )}
                          </td>
                          <td data-label="Fecha Límite">
                            {getDeadlineBadge() || <em style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin fecha límite</em>}
                          </td>
                          <td data-label="Acciones">
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', flex: 1 }}
                                onClick={() => openEditExerciseModal(ex)}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn danger"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', flex: 1 }}
                                onClick={() => deleteExercise(ex.id, ex.name)}
                              >
                                Eliminar
                              </button>
                            </div>
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

      {(activeTab === 'results' || user?.role === 'STUDENT') && (
        <div className="card">
          <h2>{user?.role === 'STUDENT' ? 'Mis Resultados' : 'Resultados y Dashboard'}</h2>
          
          <div>
            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Dashboard de Resultados</h3>
                  {dash && dash.enrollments.length > 0 && (
                    <button 
                      className="btn secondary" 
                      onClick={exportCSV}
                      disabled={exporting}
                    >
                      {exporting ? 'Exportando...' : 'Exportar CSV'}
                    </button>
                  )}
                </div>

                {dash && dash.enrollments.length > 0 ? (
                  <>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '1.5rem' }}>
                      <div className="stat-card">
                        <div className="stat-value">{dash.total_exercises}</div>
                        <div className="stat-label">Ejercicios</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{dash.aggregates?.avg_grade?.toFixed(2) || '0.0'}</div>
                        <div className="stat-label">Promedio</div>
                      </div>
                      <div className="stat-card" style={{ background: 'var(--success)' }}>
                        <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.pct_green?.toFixed(0) || '0'}%</div>
                        <div className="stat-label" style={{ color: 'white' }}>Verde</div>
                      </div>
                      <div className="stat-card" style={{ background: 'var(--warning)' }}>
                        <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.pct_yellow?.toFixed(0) || '0'}%</div>
                        <div className="stat-label" style={{ color: 'white' }}>Amarillo</div>
                      </div>
                      <div className="stat-card" style={{ background: 'var(--danger)' }}>
                        <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.pct_red?.toFixed(0) || '0'}%</div>
                        <div className="stat-label" style={{ color: 'white' }}>Rojo</div>
                      </div>
                    </div>

                    <div className="data-table">
                      <table className="table mobile-card-view">
                        <thead>
                          <tr>
                            <th>Estudiante</th>
                            <th>Total</th>
                            <th>Verde</th>
                            <th>Amarillo</th>
                            <th>Rojo</th>
                            <th>Nota</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dash.enrollments.map((i) => (
                            <tr key={i.enrollment_id}>
                              <td data-label="Estudiante"><strong>{i.student_email}</strong></td>
                              <td data-label="Total">{i.total}</td>
                              <td data-label="Verde">{i.green}</td>
                              <td data-label="Amarillo">{i.yellow}</td>
                              <td data-label="Rojo">{i.red}</td>
                              <td data-label="Nota"><strong>{i.grade?.toFixed(2)}</strong></td>
                              <td data-label="Estado"><StatusBadge status={i.semaphore} grade={i.grade} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="notice" style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem 0' }}>No hay resultados cargados</p>
                    <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
                      Asegúrate de tener estudiantes inscritos y ejercicios creados, luego carga los resultados vía CSV
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Student View: List of Exercises */}
            {user?.role === 'STUDENT' && (
              <div style={{ marginTop: '0' }}>
                <h3>Mis Ejercicios ({studentExercisesList.length})</h3>
                <div className="data-table">
                  <table className="table mobile-card-view">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Fecha Límite</th>
                        <th>Estado</th>
                        <th>Adjunto</th>
                        <th>Mi Entrega</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentExercisesList.map(item => (
                        <tr key={item.id}>
                          <td data-label="Ejercicio">
                            <strong>{item.name}</strong>
                            {item.description && <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{item.description}</div>}
                          </td>
                          <td data-label="Fecha Límite">
                            {item.deadline ? new Date(item.deadline).toLocaleDateString() : '-'}
                          </td>
                          <td data-label="Estado">
                            {item.result ? (
                               <StatusBadge status={item.result.status} grade={item.result.status === 'GREEN' ? 5.0 : item.result.status === 'YELLOW' ? 3.0 : 1.0} />
                            ) : (
                               <span className="badge" style={{background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem'}}>Pendiente</span>
                            )}
                          </td>
                          <td data-label="Adjunto">
                             {item.attachment ? (
                               <a href={item.attachment} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)', textDecoration: 'underline'}}>Descargar</a>
                             ) : '-'}
                          </td>
                          <td data-label="Mi Entrega">
                             {item.result?.submission_file ? (
                               <a href={item.result.submission_file} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)', textDecoration: 'underline'}}>Ver Archivo</a>
                             ) : '-'}
                          </td>
                          <td data-label="Acción">
                             {(!item.result || item.result.status === 'SUBMITTED' || item.result.status === 'RED') && (
                               <button 
                                 className="btn secondary" 
                                 style={{padding: '0.3rem 0.6rem', fontSize: '0.85rem'}}
                                 onClick={() => setUploadingExercise(item)}
                               >
                                 {item.result ? 'Reenviar' : 'Subir Solución'}
                               </button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Teacher/Admin View: Detailed Results Table */}
            {user?.role !== 'STUDENT' && detailedResults.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h3>Resultados Individuales (Editable) - {detailedResults.length} resultados</h3>
                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                  <p className="notice" style={{ marginBottom: '1rem' }}>
                    Haz clic en "Editar" para cambiar el estado de cualquier resultado individual
                  </p>
                )}

                {/* Filtros */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder={user?.role === 'STUDENT' ? '🔍 Buscar por ejercicio...' : '🔍 Buscar por estudiante o ejercicio...'}
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
                    <option value="ALL">Todos los estados</option>
                    <option value="GREEN">Aprobado</option>
                    <option value="YELLOW">Suficiente</option>
                    <option value="RED">Reprobado</option>
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
                  <div className="data-table" style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table className="table mobile-card-view" style={{ tableLayout: 'fixed', width: '100%', minWidth: user?.role === 'STUDENT' ? '100%' : '100%' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
                        <tr>
                          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && <th>Estudiante</th>}
                          <th>Ejercicio</th>
                          <th style={{ width: '120px' }}>Estado</th>
                          <th style={{ width: '200px' }}>Solución</th>
                          <th style={{ width: '250px', maxWidth: '250px' }}>Comentarios</th>
                          <th style={{ width: '150px' }}>Actualizado</th>
                          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && <th style={{ width: '100px' }}>Acción</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((result) => (
                          <tr key={result.id}>
                            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                              <td data-label="Estudiante" style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={result.student_email}>{result.student_email}</td>
                            )}
                            <td data-label="Ejercicio" style={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }} title={result.exercise_name}>{result.exercise_name}</td>
                            <td data-label="Estado">
                              <StatusBadge status={result.status} grade={result.status === 'GREEN' ? 5.0 : result.status === 'YELLOW' ? 3.0 : 1.0} />
                            </td>
                            <td data-label="Solución">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {result.submission_file && (
                                      <a href={result.submission_file} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.9rem'}}>
                                          📄 Descargar Archivo
                                      </a>
                                  )}
                                  {result.submission_text && (
                                      <button
                                        type="button"
                                        onClick={() => setViewingSubmission(result)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          color: 'var(--primary)',
                                          textDecoration: 'underline',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          textAlign: 'left',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}
                                      >
                                        📝 Ver Texto
                                      </button>
                                  )}
                                  {!result.submission_file && !result.submission_text && (
                                      <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>-</span>
                                  )}
                                </div>
                            </td>
                            <td data-label="Comentarios" style={{ 
                              fontSize: '0.85rem', 
                              color: 'var(--text-secondary)', 
                              maxWidth: '250px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {result.comment ? (
                                <span title={result.comment} style={{ 
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {result.comment}
                                </span>
                              ) : (
                                <em style={{ color: 'var(--text-muted)' }}>Sin comentarios</em>
                              )}
                            </td>
                            <td data-label="Actualizado" style={{ fontSize: '0.85rem' }}>{new Date(result.updated_at).toLocaleString('es-CO')}</td>
                            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                              <td data-label="Acción">
                                <button
                                  className="btn secondary"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                                  onClick={() => openEditModal(result)}
                                >
                                  Editar
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <>
                {/* Asignar Resultado Individual */}
                <div style={{ marginTop: '3rem', marginBottom: '2rem', padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ margin: 0 }}>Asignar Resultado Individual</h3>
                    <button className="btn" onClick={openCreateResultForm}>
                      Nuevo Resultado
                    </button>
                  </div>
                  <p className="notice" style={{ margin: 0 }}>
                    Asigna resultados manualmente seleccionando un estudiante y un ejercicio
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h3>Cargar Resultados desde CSV</h3>
                  <CSVUpload
                    label="Cargar resultados (columnas: student_email, exercise_name, status)"
                    uploadUrl={`/api/v1/courses/subjects/${id}/results/upload-csv/`}
                    onComplete={loadAll}
                  />
                  <p className="notice" style={{ marginTop: '0.5rem' }}>
                    💡 Los ejercicios se crean automáticamente si no existen al subir el CSV
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Exercise Modal */}
      {editingExercise && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
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
          onClick={closeEditExerciseModal}
          onKeyDown={(e) => e.key === 'Escape' && closeEditExerciseModal()}
        >
          <div 
            className="card modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-exercise-modal-title"
            tabIndex={-1}
            style={{ 
              maxWidth: '600px', 
              width: '100%',
              margin: '0',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-exercise-modal-title">Editar Ejercicio</h2>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0' }}><strong>Ejercicio Original:</strong> {editingExercise.name}</p>
              {editingExercise.deadline && (
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Fecha Límite Actual:</strong>{' '}
                  {new Date(editingExercise.deadline).toLocaleDateString('es-CO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            <form onSubmit={updateExercise}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-exercise-name"><strong>Nombre del Ejercicio *</strong></label>
                <input
                  id="edit-exercise-name"
                  type="text"
                  value={editExerciseName}
                  onChange={(e) => setEditExerciseName(e.target.value)}
                  placeholder="Ej: Taller 1 - Variables"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-exercise-deadline"><strong>Fecha Límite (Opcional)</strong></label>
                <input
                  id="edit-exercise-deadline"
                  type="datetime-local"
                  value={editExerciseDeadline}
                  onChange={(e) => setEditExerciseDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  💡 Deja vacío si no tiene fecha límite
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-exercise-desc"><strong>Descripción (Opcional)</strong></label>
                <textarea
                  id="edit-exercise-desc"
                  value={editExerciseDescription}
                  onChange={(e) => setEditExerciseDescription(e.target.value)}
                  placeholder="Descripción detallada del ejercicio, objetivos, requisitos..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-exercise-file"><strong>Archivo Adjunto (Opcional)</strong></label>
                <input 
                  id="edit-exercise-file"
                  type="file" 
                  onChange={(e) => setEditExerciseFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  💡 Sube un nuevo archivo para reemplazar el anterior (si existe)
                </p>
              </div>

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
                  Guardar Cambios
                </button>
                <button 
                  type="button"
                  className="btn secondary"
                  onClick={closeEditExerciseModal}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {editingResult && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
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
          onKeyDown={(e) => e.key === 'Escape' && closeEditModal()}
        >
          <div 
            className="card modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-result-modal-title"
            tabIndex={-1}
            style={{ 
              maxWidth: '500px', 
              width: '100%',
              margin: '0',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-result-modal-title">Editar Resultado</h2>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0' }}><strong>Estudiante:</strong> {editingResult.studentEmail}</p>
              <p style={{ margin: '0.5rem 0' }}><strong>Ejercicio:</strong> {editingResult.exerciseName}</p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Estado Actual:</strong>{' '}
                <StatusBadge 
                  status={editingResult.currentStatus} 
                  grade={editingResult.currentStatus === 'GREEN' ? 5.0 : editingResult.currentStatus === 'YELLOW' ? 3.0 : 1.0} 
                />
              </p>
              {editingResult.currentComment && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                  <strong>Comentario Anterior:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {editingResult.currentComment}
                  </p>
                </div>
              )}

              {(editingResult.submissionText || editingResult.submissionFile) && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <strong>Entrega del Estudiante:</strong>
                  
                  {editingResult.submissionFile && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <a 
                        href={editingResult.submissionFile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        📄 Ver Archivo Adjunto
                      </a>
                    </div>
                  )}

                  {editingResult.submissionText && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Respuesta de Texto:</label>
                      <div style={{ 
                        marginTop: '0.25rem', 
                        padding: '0.5rem', 
                        background: 'var(--bg-card)', 
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.9rem',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid var(--border)'
                      }}>
                        {editingResult.submissionText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={updateResultStatus}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-result-status"><strong>Nuevo Estado</strong></label>
                <select
                  id="edit-result-status"
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
                  <option value="GREEN">Aprobado - Completado exitosamente</option>
                  <option value="YELLOW">Suficiente - Con observaciones</option>
                  <option value="RED">Reprobado - No completado</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}><strong>Comentarios / Retroalimentación (Opcional)</strong></label>
                  <button
                    type="button"
                    onClick={generateAIFeedback}
                    disabled={generatingAI}
                    className="btn secondary"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      color: 'white',
                      border: 'none'
                    }}
                    title="Generar sugerencia usando IA basada en el estado seleccionado"
                  >
                    {generatingAI ? '✨ Generando...' : '✨ Generar con IA'}
                  </button>
                </div>
                <textarea
                  id="edit-result-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe observaciones, sugerencias o felicitaciones para el estudiante..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  💡 Los comentarios ayudan al estudiante a entender qué puede mejorar
                </p>
              </div>

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
                  Guardar Cambios
                </button>
                <button 
                  type="button"
                  className="btn secondary"
                  onClick={closeEditModal}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Result Modal */}
      {showCreateResultForm && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
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
          onClick={closeCreateResultForm}
          onKeyDown={(e) => e.key === 'Escape' && closeCreateResultForm()}
        >
          <div 
            className="card modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-result-modal-title"
            tabIndex={-1}
            style={{ 
              maxWidth: '600px', 
              width: '100%',
              margin: '0',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-result-modal-title">Asignar Resultado Individual</h2>
            
            <p className="notice" style={{ marginBottom: '1.5rem' }}>
              Selecciona un estudiante inscrito y un ejercicio existente para asignarle un resultado
            </p>

            <form onSubmit={createResult}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="create-result-student"><strong>Estudiante</strong></label>
                <select
                  id="create-result-student"
                  value={selectedEnrollmentId}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  required
                  style={{ 
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <option value="">-- Selecciona un estudiante --</option>
                  {enrollments.map(enrollment => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.student.email} - {enrollment.student.first_name} {enrollment.student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="create-result-exercise"><strong>Ejercicio</strong></label>
                <select
                  id="create-result-exercise"
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  required
                  style={{ 
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <option value="">-- Selecciona un ejercicio --</option>
                  {exercises.map(exercise => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name} {exercise.deadline && `(Entrega: ${new Date(exercise.deadline).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="create-result-status"><strong>Estado del Resultado</strong></label>
                <select
                  id="create-result-status"
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  required
                  style={{ 
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <option value="GREEN">Aprobado - Completado exitosamente</option>
                  <option value="YELLOW">Suficiente - Con observaciones</option>
                  <option value="RED">Reprobado - No completado</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label htmlFor="create-result-comment" style={{ margin: 0 }}><strong>Comentarios / Retroalimentación (Opcional)</strong></label>
                  <button
                    type="button"
                    onClick={generateAICreateFeedback}
                    disabled={generatingAI}
                    className="btn secondary"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      color: 'white',
                      border: 'none'
                    }}
                    title="Generar sugerencia usando IA basada en el estado seleccionado"
                  >
                    {generatingAI ? '✨ Generando...' : '✨ Generar con IA'}
                  </button>
                </div>
                <textarea
                  id="create-result-comment"
                  value={createComment}
                  onChange={(e) => setCreateComment(e.target.value)}
                  placeholder="Escribe observaciones, sugerencias o felicitaciones para el estudiante..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  💡 Los comentarios ayudan al estudiante a entender qué puede mejorar
                </p>
              </div>

              {error && (
                <div className="alert error" style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="submit" 
                  className="btn"
                  style={{ flex: 1 }}
                >
                  Asignar Resultado
                </button>
                <button 
                  type="button"
                  className="btn secondary"
                  onClick={closeCreateResultForm}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Solution Modal */}
      {uploadingExercise && (
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
          onClick={() => setUploadingExercise(null)}
        >
          <div 
            className="card modal-responsive" 
            style={{ 
              maxWidth: '500px', 
              width: '100%',
              margin: '0',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Subir Solución</h2>
            <p><strong>Ejercicio:</strong> {uploadingExercise.name}</p>
            
            <form onSubmit={submitSolution}>
              <div style={{ marginBottom: '1rem' }}>
                <label><strong>Seleccionar Archivo (PDF, DOCX, XLSX - Máx 1MB)</strong></label>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.xlsx"
                  onChange={(e) => setSubmissionFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <span>- O -</span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label><strong>Respuesta de Texto (Máx 5000 caracteres)</strong></label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  rows="6"
                  maxLength={5000}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              {error && (
                <div className="alert error" style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Subir</button>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => setUploadingExercise(null)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Submission Text Modal */}
      {viewingSubmission && (
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
          onClick={() => setViewingSubmission(null)}
        >
          <div 
            className="card modal-responsive" 
            style={{ 
              maxWidth: '600px', 
              width: '100%',
              margin: '0',
              animation: 'fadeIn 0.2s ease',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Solución de Texto</h2>
              <button 
                onClick={() => setViewingSubmission(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Estudiante:</strong> {viewingSubmission.student_email}</p>
              <p><strong>Ejercicio:</strong> {viewingSubmission.exercise_name}</p>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1rem', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px',
              border: '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              {viewingSubmission.submission_text}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button 
                className="btn secondary" 
                onClick={() => setViewingSubmission(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
