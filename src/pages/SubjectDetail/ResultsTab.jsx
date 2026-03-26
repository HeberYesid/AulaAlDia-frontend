import { useState, useMemo, useRef, useEffect } from 'react'
import { api } from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import CSVUpload from '../../components/CSVUpload'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function handleFocusTrap(e, ref) {
  if (e.key !== 'Tab') return
  const focusables = [...(ref.current?.querySelectorAll(FOCUSABLE) || [])]
  if (focusables.length < 2) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

export default function ResultsTab({
  user, id, subject, dash, enrollments, exercises, detailedResults,
  academicPeriodsById, gradeBounds, gradeSettings, gradeRanges,
  getScaleLabel, loadAll, setError, setSuccess
}) {
  const [resultSearch, setResultSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [exporting, setExporting] = useState(false)

  // Edit result
  const [editingResult, setEditingResult] = useState(null)
  const [newScore, setNewScore] = useState('')
  const [newComment, setNewComment] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)

  // Create result
  const [showCreateResultForm, setShowCreateResultForm] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [createScore, setCreateScore] = useState(String(gradeBounds.passing.toFixed(2)))
  const [createComment, setCreateComment] = useState('')

  // View submission
  const [viewingSubmission, setViewingSubmission] = useState(null)

  const editResultDialogRef = useRef(null)
  const createResultDialogRef = useRef(null)
  const viewSubmissionDialogRef = useRef(null)
  const lastFocusRef = useRef(null)

  useEffect(() => { if (editingResult) editResultDialogRef.current?.focus() }, [editingResult])
  useEffect(() => { if (showCreateResultForm) createResultDialogRef.current?.focus() }, [showCreateResultForm])
  useEffect(() => { if (viewingSubmission) viewSubmissionDialogRef.current?.focus() }, [viewingSubmission])

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  /* ── Computed ── */

  const editableExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const period = exercise.academic_period ? academicPeriodsById[exercise.academic_period] : null
      return !period || !period.is_grade_locked
    })
  }, [exercises, academicPeriodsById])

  const filteredResults = useMemo(() => {
    let filtered = detailedResults
    if (user?.role === 'STUDENT' && user?.email) {
      filtered = filtered.filter(r => r.student_email === user.email)
    }
    if (statusFilter === 'SCORED') filtered = filtered.filter(r => r.score !== null && r.score !== undefined)
    if (statusFilter === 'SUBMITTED') filtered = filtered.filter(r => r.status === 'SUBMITTED')
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

  /* ── Helpers ── */

  const getExercisePeriod = (exerciseId) => {
    const exercise = exercises.find(item => item.id === Number(exerciseId))
    if (!exercise?.academic_period) return null
    return academicPeriodsById[exercise.academic_period] || null
  }

  const isExerciseGradeLocked = (exerciseId) => Boolean(getExercisePeriod(exerciseId)?.is_grade_locked)

  const formatPeriodState = (period) => {
    if (!period) return 'Sin periodo'
    if (period.is_closed) return 'Cerrado'
    if (period.is_grade_locked) return 'Bloqueado'
    return 'Abierto'
  }

  /* ── Handlers ── */

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const response = await api.get(`/api/v1/courses/subjects/${id}/export-csv/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${subject?.code || 'resultados'}_consolidado.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo exportar el CSV. Verifica permisos.')
    } finally {
      setExporting(false)
    }
  }

  const openEditModal = (result) => {
    if (isExerciseGradeLocked(result.exercise)) {
      setError('Este resultado pertenece a un periodo bloqueado y ya no puede editarse.')
      return
    }
    lastFocusRef.current = document.activeElement
    setEditingResult({
      resultId: result.id,
      exerciseId: result.exercise,
      currentScore: result.score,
      currentComment: result.comment || '',
      studentEmail: result.student_email,
      exerciseName: result.exercise_name,
      submissionText: result.submission_text,
      submissionFile: result.submission_file
    })
    setNewScore(result.score != null ? String(result.score) : String(gradeBounds.passing.toFixed(2)))
    setNewComment(result.comment || '')
    setError('')
  }

  const closeEditModal = () => {
    setEditingResult(null)
    setNewScore('')
    setNewComment('')
    setError('')
    setTimeout(() => lastFocusRef.current?.focus(), 0)
  }

  const handleUpdateResult = async (e) => {
    e.preventDefault()
    if (!editingResult) return
    if (isExerciseGradeLocked(editingResult.exerciseId)) {
      setError('Este periodo ya no permite editar notas.')
      return
    }
    try {
      await api.patch(`/api/v1/courses/results/${editingResult.resultId}/`, {
        score: Number(newScore),
        status: null,
        comment: newComment
      })
      setSuccess(`Resultado actualizado: ${editingResult.studentEmail} - ${editingResult.exerciseName} → Nota ${Number(newScore).toFixed(2)}`)
      closeEditModal()
      loadAll()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.score?.[0] || 'No se pudo actualizar el resultado.'
      setError(errorMsg)
    }
  }

  const openCreateResultForm = () => {
    lastFocusRef.current = document.activeElement
    setShowCreateResultForm(true)
    setSelectedEnrollmentId('')
    setSelectedExerciseId('')
    setCreateScore(String(gradeBounds.passing.toFixed(2)))
    setCreateComment('')
    setError('')
    setSuccess('')
  }

  const closeCreateResultForm = () => {
    setShowCreateResultForm(false)
    setSelectedEnrollmentId('')
    setSelectedExerciseId('')
    setCreateScore(String(gradeBounds.passing.toFixed(2)))
    setCreateComment('')
    setError('')
    setTimeout(() => lastFocusRef.current?.focus(), 0)
  }

  const handleCreateResult = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedEnrollmentId || !selectedExerciseId) { setError('Debes seleccionar un estudiante y un ejercicio'); return }
    if (isExerciseGradeLocked(selectedExerciseId)) { setError('El ejercicio seleccionado pertenece a un periodo bloqueado para notas.'); return }

    try {
      await api.post('/api/v1/courses/results/', {
        enrollment: selectedEnrollmentId,
        exercise: selectedExerciseId,
        score: Number(createScore),
        comment: createComment
      })
      const enrollment = enrollments.find(e => e.id === parseInt(selectedEnrollmentId))
      const exercise = exercises.find(ex => ex.id === parseInt(selectedExerciseId))
      setSuccess(`Resultado asignado: ${enrollment?.student?.email} - ${exercise?.name} → Nota ${Number(createScore).toFixed(2)}`)
      closeCreateResultForm()
      loadAll()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.score?.[0] || 'No se pudo crear el resultado.'
      setError(errorMsg)
    }
  }

  const handleGenerateAIFeedback = async () => {
    if (!newScore) { setError('Ingresa una nota primero para generar feedback acorde.'); return }
    setGeneratingAI(true)
    setError('')
    try {
      const originalResult = detailedResults.find(r => r.id === editingResult.resultId)
      if (!originalResult) throw new Error('No se encontró el resultado original')
      const response = await api.post('/api/v1/courses/results/generate-ai-feedback/', {
        exercise_id: originalResult.exercise,
        score: Number(newScore),
        current_comment: newComment || editingResult.currentComment,
        student_email: editingResult.studentEmail
      })
      setNewComment(response.data.feedback)
    } catch {
      setError('Error al generar feedback con IA. Intenta de nuevo.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleGenerateAICreateFeedback = async () => {
    if (!createScore) { setError('Ingresa una nota primero para generar feedback acorde.'); return }
    if (!selectedExerciseId) { setError('Selecciona un ejercicio primero.'); return }
    if (!selectedEnrollmentId) { setError('Selecciona un estudiante primero.'); return }
    setGeneratingAI(true)
    setError('')
    try {
      const enrollment = enrollments.find(e => e.id == selectedEnrollmentId)
      const response = await api.post('/api/v1/courses/results/generate-ai-feedback/', {
        exercise_id: selectedExerciseId,
        score: Number(createScore),
        current_comment: createComment,
        student_email: enrollment ? enrollment.student.email : ''
      })
      setCreateComment(response.data.feedback)
    } catch {
      setError('Error al generar feedback con IA. Intenta de nuevo.')
    } finally {
      setGeneratingAI(false)
    }
  }

  /* ── Render ── */
  return (
    <div className="tab-sections" role="tabpanel" aria-labelledby="tab-results">

      {/* ── Dashboard Summary (Teacher/Admin only) ── */}
      {isTeacherOrAdmin && (
        <>
          {/* Stats cards */}
          {dash && dash.enrollments.length > 0 ? (
            <>
              <div className="card card--static section-card">
                <div className="section-header">
                  <h3>Resumen</h3>
                  <button className="btn secondary" onClick={handleExportCSV} disabled={exporting}>
                    {exporting ? 'Exportando…' : 'Exportar CSV'}
                  </button>
                </div>

                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <div className="stat-card">
                    <div className="stat-value">{dash.total_exercises}</div>
                    <div className="stat-label">Ejercicios</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{dash.aggregates?.avg_grade?.toFixed(2) || '0.0'}</div>
                    <div className="stat-label">Nota promedio</div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--success)' }}>
                    <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.avg_score?.toFixed(2) || '0.0'}</div>
                    <div className="stat-label" style={{ color: 'white' }}>Prom. ejercicios</div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--warning)' }}>
                    <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.total_graded_results || 0}</div>
                    <div className="stat-label" style={{ color: 'white' }}>Calificados</div>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--danger)' }}>
                    <div className="stat-value" style={{ color: 'white' }}>{dash.aggregates?.total_submitted_results || 0}</div>
                    <div className="stat-label" style={{ color: 'white' }}>Por revisar</div>
                  </div>
                </div>
              </div>

              {/* Dashboard Table */}
              <div className="card card--static section-card">
                <div className="section-header">
                  <h3>Notas por Estudiante</h3>
                </div>
                <div className="data-table">
                  <table className="table mobile-card-view">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Total</th>
                        <th>Calificados</th>
                        <th>Entregados</th>
                        <th>Promedio</th>
                        <th>Nota final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.enrollments.map(i => (
                        <tr key={i.enrollment_id}>
                          <td data-label="Estudiante"><strong>{i.student_email}</strong></td>
                          <td data-label="Total">{i.total_exercises}</td>
                          <td data-label="Calificados">{i.graded_count}</td>
                          <td data-label="Entregados">{i.submitted_count}</td>
                          <td data-label="Promedio"><strong>{i.average_score?.toFixed(2)}</strong></td>
                          <td data-label="Nota final"><StatusBadge status={null} grade={i.grade} label={getScaleLabel(i.grade, i.grade_label)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card card--static section-card">
              <div className="empty-state">
                <p className="empty-state__title">No hay resultados cargados</p>
                <p className="empty-state__text">Asegúrate de tener estudiantes inscritos y ejercicios creados, luego carga los resultados vía CSV.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Detailed Results Table ── */}
      {detailedResults.length > 0 && (
        <div className="card card--static section-card">
          <div className="section-header">
            <h3>Resultados Individuales ({detailedResults.length})</h3>
          </div>

          {isTeacherOrAdmin && (
            <p className="notice" style={{ marginBottom: 'var(--space-md)' }}>
              Haz clic en &ldquo;Editar&rdquo; para cambiar el estado de cualquier resultado individual.
            </p>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <input
              type="text"
              aria-label={user?.role === 'STUDENT' ? 'Buscar resultado por ejercicio' : 'Buscar resultado por estudiante o ejercicio'}
              placeholder={user?.role === 'STUDENT' ? 'Buscar por ejercicio…' : 'Buscar por estudiante o ejercicio…'}
              value={resultSearch}
              onChange={(e) => setResultSearch(e.target.value)}
              style={{ flex: '1 1 300px' }}
            />
            <select
              aria-label="Filtrar resultados por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ flex: '0 1 200px' }}
            >
              <option value="ALL">Todos</option>
              <option value="SCORED">Con nota</option>
              <option value="SUBMITTED">Sin calificar</option>
            </select>
          </div>

          {(resultSearch || statusFilter !== 'ALL') && (
            <p className="notice" style={{ marginBottom: 'var(--space-md)' }}>
              Mostrando {filteredResults.length} de {detailedResults.length} resultados
            </p>
          )}

          {filteredResults.length === 0 ? (
            <p className="notice">No se encontraron resultados con los filtros aplicados.</p>
          ) : (
            <div className="data-table" style={{ maxHeight: 500, overflowY: 'auto', overflowX: 'auto' }}>
              <table className="table mobile-card-view" style={{ tableLayout: 'auto', width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                  <tr>
                    {isTeacherOrAdmin && <th>Estudiante</th>}
                    <th>Ejercicio</th>
                    <th>Resultado</th>
                    <th>Solución</th>
                    <th>Comentarios</th>
                    <th>Actualizado</th>
                    {isTeacherOrAdmin && <th>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(result => (
                    <tr key={result.id}>
                      {isTeacherOrAdmin && (
                        <td data-label="Estudiante" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={result.student_email}>{result.student_email}</td>
                      )}
                      <td data-label="Ejercicio" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={result.exercise_name}>{result.exercise_name}</td>
                      <td data-label="Resultado">
                        <StatusBadge status={result.status} grade={result.score} label={getScaleLabel(result.score)} locked={isExerciseGradeLocked(result.exercise)} />
                      </td>
                      <td data-label="Solución">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                          {result.submission_file && (
                            <a href={result.submission_file} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: 'var(--font-size-sm)' }}>Descargar Archivo</a>
                          )}
                          {result.submission_text && (
                            <button type="button" onClick={() => setViewingSubmission(result)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'var(--font-size-sm)', textAlign: 'left' }}>Ver Texto</button>
                          )}
                          {!result.submission_file && !result.submission_text && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Comentarios" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.comment ? (
                          <span title={result.comment} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.comment}</span>
                        ) : (
                          <em style={{ color: 'var(--text-muted)' }}>Sin comentarios</em>
                        )}
                      </td>
                      <td data-label="Actualizado" style={{ fontSize: 'var(--font-size-sm)' }}>{new Date(result.updated_at).toLocaleString('es-CO')}</td>
                      {isTeacherOrAdmin && (
                        <td data-label="Acción">
                          <button className="btn secondary" style={{ padding: '0.3rem 0.6rem', fontSize: 'var(--font-size-sm)' }} onClick={() => openEditModal(result)} disabled={isExerciseGradeLocked(result.exercise)} title={isExerciseGradeLocked(result.exercise) ? 'Periodo bloqueado' : 'Editar resultado'}>
                            {isExerciseGradeLocked(result.exercise) ? 'Bloqueado' : 'Editar'}
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

      {/* ── Assign / Upload Results (Teacher/Admin) ── */}
      {isTeacherOrAdmin && (
        <>
          <div className="card card--static section-card">
            <div className="section-header">
              <h3>Asignar Resultado Individual</h3>
              <button className="btn" onClick={openCreateResultForm}>Nuevo Resultado</button>
            </div>
            <p className="notice" style={{ margin: 0 }}>
              Asigna resultados manualmente seleccionando un estudiante y un ejercicio.
            </p>
          </div>

          <div className="card card--static section-card">
            <div className="section-header">
              <h3>Cargar Resultados desde CSV</h3>
            </div>
            <CSVUpload
              label="Cargar resultados (columnas: student_email, exercise_name, score[, comment])"
              uploadUrl={`/api/v1/courses/subjects/${id}/results/upload-csv/`}
              onComplete={loadAll}
            />
            <p className="notice" style={{ marginTop: 'var(--space-sm)' }}>
              Los ejercicios se crean automáticamente si no existen al subir el CSV.
            </p>
          </div>
        </>
      )}

      {/* ═══ MODALS ═══ */}

      {/* ── Edit Result Modal ── */}
      {editingResult && isTeacherOrAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }} role="presentation">
          <button type="button" className="modal-backdrop-button" aria-label="Cerrar modal de editar resultado" onClick={closeEditModal} />
          <div
            className="card modal-responsive"
            role="dialog" aria-modal="true" aria-labelledby="edit-result-modal-title"
            tabIndex={-1} ref={editResultDialogRef}
            onKeyDown={(e) => handleFocusTrap(e, editResultDialogRef)}
            style={{ maxWidth: 500, width: '100%', margin: 0, position: 'relative', zIndex: 1, animation: 'fadeIn 0.2s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-result-modal-title">Editar Resultado</h2>

            <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              <p style={{ margin: 'var(--space-xs) 0' }}><strong>Estudiante:</strong> {editingResult.studentEmail}</p>
              <p style={{ margin: 'var(--space-xs) 0' }}><strong>Ejercicio:</strong> {editingResult.exerciseName}</p>
              {getExercisePeriod(editingResult.exerciseId) && (
                <p style={{ margin: 'var(--space-xs) 0' }}>
                  <strong>Periodo:</strong> {getExercisePeriod(editingResult.exerciseId).label} &middot; {formatPeriodState(getExercisePeriod(editingResult.exerciseId))}
                </p>
              )}
              <p style={{ margin: 'var(--space-xs) 0' }}>
                <strong>Actual:</strong>{' '}
                <StatusBadge status={editingResult.currentScore == null ? 'SUBMITTED' : null} grade={editingResult.currentScore} label={getScaleLabel(editingResult.currentScore)} locked={isExerciseGradeLocked(editingResult.exerciseId)} />
              </p>
              {editingResult.currentComment && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                  <strong>Comentario Anterior:</strong>
                  <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{editingResult.currentComment}</p>
                </div>
              )}
              {(editingResult.submissionText || editingResult.submissionFile) && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
                  <strong>Entrega del Estudiante:</strong>
                  {editingResult.submissionFile && (
                    <div style={{ marginTop: 'var(--space-xs)' }}>
                      <a href={editingResult.submissionFile} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Ver Archivo Adjunto</a>
                    </div>
                  )}
                  {editingResult.submissionText && (
                    <div style={{ marginTop: 'var(--space-xs)' }}>
                      <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-sm)', maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-primary)' }}>
                        {editingResult.submissionText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateResult}>
              <div>
                <label htmlFor="edit-result-score">Nueva Nota ({gradeBounds.min.toFixed(2)} – {gradeBounds.max.toFixed(2)})</label>
                <input id="edit-result-score" type="number" min={gradeBounds.min} max={gradeBounds.max} step="0.01" value={newScore} onChange={(e) => setNewScore(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="edit-result-comment">Comentarios / Retroalimentación (Opcional)</label>
                <textarea id="edit-result-comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Observaciones, sugerencias o felicitaciones…" rows="4" />
                <p className="notice" style={{ marginTop: 'var(--space-xs)' }}>Los comentarios ayudan al estudiante a entender qué puede mejorar.</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Guardar Cambios</button>
                <button type="button" className="btn secondary" onClick={closeEditModal} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Result Modal ── */}
      {showCreateResultForm && isTeacherOrAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }} role="presentation">
          <button type="button" className="modal-backdrop-button" aria-label="Cerrar modal de crear resultado" onClick={closeCreateResultForm} />
          <div
            className="card modal-responsive"
            role="dialog" aria-modal="true" aria-labelledby="create-result-modal-title"
            tabIndex={-1} ref={createResultDialogRef}
            onKeyDown={(e) => handleFocusTrap(e, createResultDialogRef)}
            style={{ maxWidth: 600, width: '100%', margin: 0, position: 'relative', zIndex: 1, animation: 'fadeIn 0.2s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-result-modal-title">Asignar Resultado Individual</h2>

            <form onSubmit={handleCreateResult}>
              <div>
                <label htmlFor="create-result-student">Estudiante</label>
                <select id="create-result-student" value={selectedEnrollmentId} onChange={(e) => setSelectedEnrollmentId(e.target.value)} required>
                  <option value="">— Selecciona un estudiante —</option>
                  {enrollments.map(enrollment => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.student.email} — {enrollment.student.first_name} {enrollment.student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="create-result-exercise">Ejercicio</label>
                <select id="create-result-exercise" value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)} required>
                  <option value="">— Selecciona un ejercicio —</option>
                  {editableExercises.map(exercise => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name} {exercise.deadline && `(Entrega: ${new Date(exercise.deadline).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
                {selectedExerciseId && getExercisePeriod(selectedExerciseId) && (
                  <p className="notice" style={{ marginTop: 'var(--space-xs)' }}>
                    {getExercisePeriod(selectedExerciseId).label} &middot; {formatPeriodState(getExercisePeriod(selectedExerciseId))}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="create-result-score">Nota ({gradeBounds.min.toFixed(2)} – {gradeBounds.max.toFixed(2)})</label>
                <input id="create-result-score" type="number" min={gradeBounds.min} max={gradeBounds.max} step="0.01" value={createScore} onChange={(e) => setCreateScore(e.target.value)} required />
              </div>

              <div>
                <label htmlFor="create-result-comment">Comentarios / Retroalimentación (Opcional)</label>
                <textarea id="create-result-comment" value={createComment} onChange={(e) => setCreateComment(e.target.value)} placeholder="Observaciones, sugerencias o felicitaciones…" rows="4" />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Asignar Resultado</button>
                <button type="button" className="btn secondary" onClick={closeCreateResultForm} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Submission Text Modal ── */}
      {viewingSubmission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }} role="presentation">
          <button type="button" className="modal-backdrop-button" aria-label="Cerrar modal de ver solución" onClick={() => setViewingSubmission(null)} />
          <div
            className="card modal-responsive"
            role="dialog" aria-modal="true" aria-labelledby="view-submission-modal-title"
            tabIndex={-1} ref={viewSubmissionDialogRef}
            onKeyDown={(e) => handleFocusTrap(e, viewSubmissionDialogRef)}
            style={{ maxWidth: 600, width: '100%', margin: 0, position: 'relative', zIndex: 1, animation: 'fadeIn 0.2s ease', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h2 id="view-submission-modal-title" style={{ margin: 0 }}>Solución de Texto</h2>
              <button onClick={() => setViewingSubmission(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <p><strong>Estudiante:</strong> {viewingSubmission.student_email}</p>
              <p><strong>Ejercicio:</strong> {viewingSubmission.exercise_name}</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
              {viewingSubmission.submission_text}
            </div>
            <div style={{ marginTop: 'var(--space-lg)', textAlign: 'right' }}>
              <button className="btn secondary" onClick={() => setViewingSubmission(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
