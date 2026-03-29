import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import StudentsTab from './StudentsTab'
import ExercisesTab from './ExercisesTab'
import ResultsTab from './ResultsTab'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'

const DEFAULT_GRADE_SETTINGS = {
  min_grade: '1.00',
  max_grade: '5.00',
  passing_grade: '3.00',
  period_scheme: 'TRIMESTER',
}

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

export default function SubjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  /* ── Core data ── */
  const [subject, setSubject] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [dash, setDash] = useState(null)
  const [exercises, setExercises] = useState([])
  const [detailedResults, setDetailedResults] = useState([])
  const [academicPeriods, setAcademicPeriods] = useState([])

  /* ── UI state ── */
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('students')

  /* ── Student submission modal ── */
  const [uploadingExercise, setUploadingExercise] = useState(null)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionText, setSubmissionText] = useState('')
  const uploadSolutionDialogRef = useRef(null)

  useEffect(() => { if (uploadingExercise) uploadSolutionDialogRef.current?.focus() }, [uploadingExercise])

  /* ── Data loading ── */
  const loadAll = async () => {
    setLoading(true)
    try {
      const promises = [
        api.get(`/api/v1/courses/subjects/${id}/`),
        api.get(`/api/v1/courses/subjects/${id}/enrollments/`),
        api.get(`/api/v1/courses/subjects/${id}/dashboard/`),
        api.get(`/api/v1/courses/exercises/?subject=${id}`),
        api.get(`/api/v1/courses/results/?subject=${id}`),
      ]
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        promises.push(api.get('/api/v1/courses/academic-periods/'))
      }
      const results = await Promise.all(promises)
      setSubject(results[0].data)
      setEnrollments(results[1].data)
      setDash(results[2].data)
      setExercises(results[3].data)
      setDetailedResults(results[4].data)
      if (results[5]) {
        setAcademicPeriods(results[5].data?.results || results[5].data || [])
      }
    } catch {
      setError('No se pudo cargar la informacion completa de la materia. Revisa tu acceso a esta institucion e intentalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [id])

  useEffect(() => {
    if (user?.role === 'STUDENT' || user?.role === 'TUTOR') setActiveTab('results')
  }, [user])

  /* ── Grade computations ── */
  const gradeSettings = useMemo(() => dash?.academic_settings || DEFAULT_GRADE_SETTINGS, [dash])
  const gradeBounds = useMemo(() => ({
    min: Number(gradeSettings?.min_grade ?? 1),
    max: Number(gradeSettings?.max_grade ?? 5),
    passing: Number(gradeSettings?.passing_grade ?? 3),
  }), [gradeSettings])

  const academicPeriodsById = useMemo(() => Object.fromEntries(academicPeriods.map(p => [p.id, p])), [academicPeriods])

  const lockedPeriods = useMemo(() => academicPeriods.filter(p => p.is_grade_locked), [academicPeriods])

  /* ── Student-specific data ── */
  const studentStats = useMemo(() => {
    if (user?.role !== 'STUDENT' || !dash?.enrollments) return null
    return dash.enrollments.find(e => e.student_email === user.email)
  }, [dash, user])

  const studentExercisesList = useMemo(() => {
    if (user?.role !== 'STUDENT') return []
    return exercises.map(ex => {
      const result = detailedResults.find(r => r.exercise === ex.id)
      return { ...ex, result: result || null }
    })
  }, [exercises, detailedResults, user])

  const handleSubmitSolution = async (e) => {
    e.preventDefault()
    if (!uploadingExercise) return
    if (!submissionFile && !submissionText) { setError('Debes subir un archivo o escribir una respuesta'); return }
    if (submissionFile && submissionFile.size > 1024 * 1024) { setError('El archivo no puede superar 1MB'); return }

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
      setError(getApiErrorMessage(err, {
        action: 'subir tu solucion del ejercicio',
        fallback: 'No se pudo subir la solucion del ejercicio. Verifica el archivo, el tamano y el estado del periodo academico.',
      }))
    }
  }

  /* ── Render ── */
  if (loading) return <div className="card" style={{ maxWidth: 1200, margin: '2rem auto' }}>Cargando…</div>
  if (!subject) return <div className="card" style={{ maxWidth: 1200, margin: '2rem auto' }}>Materia no encontrada</div>

  return (
    <div className="subject-detail fade-in">

      {/* ═══ HEADER ═══ */}
      <div className="card card--static" style={{ margin: 0 }}>
        <div className="subject-hero">
          <div className="subject-hero__info">
            <h1>{subject.name}</h1>
            <p className="subject-hero__meta">Profesor: {subject.teacher?.email}</p>
          </div>
          <div className="subject-hero__stats">
            <div className="stat-card" style={{ minWidth: 100 }}>
              <div className="stat-value">{enrollments.length}</div>
              <div className="stat-label">Estudiantes</div>
            </div>
            <div className="stat-card" style={{ minWidth: 100 }}>
              <div className="stat-value">{exercises.length}</div>
              <div className="stat-label">Ejercicios</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MESSAGES ═══ */}
      {success && (
        <div className="card card--static" style={{ margin: 0, background: 'var(--success)', color: 'white', padding: 'var(--space-sm) var(--space-md)' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="card card--static" style={{ margin: 0, background: 'var(--danger)', color: 'white', padding: 'var(--space-sm) var(--space-md)' }}>
          {error}
        </div>
      )}

      {/* ═══ GRADE SCALE INFO (Teacher/Admin) ═══ */}
      {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
        <div className="info-strip">
          <span>
            <strong>Escala:</strong> {gradeBounds.min.toFixed(2)} – {gradeBounds.max.toFixed(2)}
          </span>
          <span><strong>Aprobación:</strong> {gradeBounds.passing.toFixed(2)}</span>
          {lockedPeriods.length > 0 && (
            <span className="notice" style={{ fontStyle: 'normal' }}>
              {lockedPeriods.length} periodo(s) bloqueado(s)
            </span>
          )}
        </div>
      )}

      {/* ═══ STUDENT VIEW ═══ */}
      {user?.role === 'STUDENT' ? (
        <>
          {/* Scale info */}
          <div className="info-strip">
            <span>
              <strong>Escala:</strong> {gradeBounds.min.toFixed(2)} – {gradeBounds.max.toFixed(2)}
            </span>
          </div>

          {/* Grade hero */}
          {studentStats && (
            <div className="card card--static" style={{ margin: 0 }}>
              <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                <h3>Mi Nota Final</h3>
              </div>
              <div className="grade-hero">
                <div>
                  <div className="grade-hero__value" style={{ color: studentStats.grade >= gradeBounds.passing ? 'var(--success)' : 'var(--danger)' }}>
                    {studentStats.grade?.toFixed(2)}
                  </div>
                </div>
                <div className="grade-hero__counters">
                  <div className="grade-hero__counter">
                    <div className="grade-hero__counter-value" style={{ color: 'var(--success)' }}>{studentStats.graded_count}</div>
                    <div className="grade-hero__counter-label">Calificados</div>
                  </div>
                  <div className="grade-hero__counter">
                    <div className="grade-hero__counter-value" style={{ color: 'var(--primary)' }}>{studentStats.submitted_count}</div>
                    <div className="grade-hero__counter-label">Entregados</div>
                  </div>
                  <div className="grade-hero__counter grade-hero__divider">
                    <div className="grade-hero__counter-value">{studentStats.total_exercises}</div>
                    <div className="grade-hero__counter-label">Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student exercises list */}
          <div className="card card--static" style={{ margin: 0 }}>
            <div className="section-header">
              <h3>Mis Ejercicios ({studentExercisesList.length})</h3>
            </div>
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
                        {item.description && <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{item.description}</div>}
                      </td>
                      <td data-label="Fecha Límite">{item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}</td>
                      <td data-label="Estado">
                        {item.result ? (
                          <StatusBadge status={item.result.status} grade={item.result.score} />
                        ) : (
                          <span className="badge PENDING">Pendiente</span>
                        )}
                      </td>
                      <td data-label="Adjunto">
                        {item.attachment ? (
                          <a href={item.attachment} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Descargar</a>
                        ) : '—'}
                      </td>
                      <td data-label="Mi Entrega">
                        {item.result?.submission_file ? (
                          <a href={item.result.submission_file} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Ver Archivo</a>
                        ) : '—'}
                      </td>
                      <td data-label="Acción">
                        {(!item.result || item.result.status === 'SUBMITTED') && (
                          <button className="btn secondary" style={{ padding: '0.3rem 0.6rem', fontSize: 'var(--font-size-sm)' }} onClick={() => setUploadingExercise(item)}>
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

          {/* Student detailed results */}
          {detailedResults.length > 0 && (
            <div className="card card--static" style={{ margin: 0 }}>
              <div className="section-header">
                <h3>Mis Resultados</h3>
              </div>
              <div className="data-table">
                <table className="table mobile-card-view">
                  <thead>
                    <tr>
                      <th>Ejercicio</th>
                      <th>Resultado</th>
                      <th>Comentarios</th>
                      <th>Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedResults.filter(r => r.student_email === user?.email).map(result => (
                      <tr key={result.id}>
                        <td data-label="Ejercicio">{result.exercise_name}</td>
                        <td data-label="Resultado"><StatusBadge status={result.status} grade={result.score} /></td>
                        <td data-label="Comentarios" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                          {result.comment || <em style={{ color: 'var(--text-muted)' }}>Sin comentarios</em>}
                        </td>
                        <td data-label="Actualizado" style={{ fontSize: 'var(--font-size-sm)' }}>{new Date(result.updated_at).toLocaleString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ═══ TEACHER / ADMIN / TUTOR VIEW ═══ */
        <>
          {/* Tab Navigation */}
          <div className="subject-tabs" role="tablist" aria-label="Secciones de la materia">
            {[
              { key: 'students', label: `Estudiantes (${enrollments.length})` },
              { key: 'exercises', label: `Ejercicios (${exercises.length})` },
              { key: 'results', label: 'Resultados' },
            ].map(tab => (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={activeTab === tab.key}
                aria-controls={`tab-panel-${tab.key}`}
                className={`subject-tab${activeTab === tab.key ? ' subject-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'students' && (
            <StudentsTab
              user={user}
              id={id}
              enrollments={enrollments}
              loadAll={loadAll}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}

          {activeTab === 'exercises' && (
            <ExercisesTab
              user={user}
              id={id}
              exercises={exercises}
              academicPeriods={academicPeriods}
              academicPeriodsById={academicPeriodsById}
              loadAll={loadAll}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}

          {activeTab === 'results' && (
            <ResultsTab
              user={user}
              id={id}
              subject={subject}
              dash={dash}
              enrollments={enrollments}
              exercises={exercises}
              detailedResults={detailedResults}
              academicPeriodsById={academicPeriodsById}
              gradeBounds={gradeBounds}
              loadAll={loadAll}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
        </>
      )}

      {/* ═══ UPLOAD SOLUTION MODAL (Student) ═══ */}
      {uploadingExercise && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }} role="presentation">
          <button type="button" className="modal-backdrop-button" aria-label="Cerrar modal de subir solución" onClick={() => setUploadingExercise(null)} />
          <div
            className="card modal-responsive"
            role="dialog" aria-modal="true" aria-labelledby="upload-solution-modal-title"
            tabIndex={-1} ref={uploadSolutionDialogRef}
            onKeyDown={(e) => handleFocusTrap(e, uploadSolutionDialogRef)}
            style={{ maxWidth: 500, width: '100%', margin: 0, position: 'relative', zIndex: 1, animation: 'fadeIn 0.2s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="upload-solution-modal-title">Subir Solución</h2>
            <p><strong>Ejercicio:</strong> {uploadingExercise.name}</p>

            <form onSubmit={handleSubmitSolution}>
              <div>
                <label htmlFor="submission-file">Archivo (PDF, DOCX, XLSX — Máx 1 MB)</label>
                <input id="submission-file" type="file" accept=".pdf,.docx,.xlsx" onChange={(e) => setSubmissionFile(e.target.files[0])} />
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>— O —</div>

              <div>
                <label htmlFor="submission-text">Respuesta de Texto (Máx 5 000 caracteres)</label>
                <textarea id="submission-text" value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} placeholder="Escribe tu respuesta aquí…" rows="6" maxLength={5000} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Subir</button>
                <button type="button" className="btn secondary" onClick={() => setUploadingExercise(null)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
