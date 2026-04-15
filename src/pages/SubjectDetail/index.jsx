import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import StudentsTab from './StudentsTab'
import ExercisesTab from './ExercisesTab'
import ResultsTab from './ResultsTab'
import { unwrapListData } from '../../utils/pagination'

const DEFAULT_GRADE_SETTINGS = {
  min_grade: '1.00',
  max_grade: '5.00',
  passing_grade: '3.00',
  period_scheme: 'TRIMESTER',
}

const normalizeEnrollmentsResponse = (data, role) => {
  if (role === 'TEACHER' && !Array.isArray(data)) {
    return []
  }

  return unwrapListData(data)
}

export default function SubjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  /* ── Core data ── */
  const [subject, setSubject] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [enrollmentCount, setEnrollmentCount] = useState(0)
  const [dash, setDash] = useState(null)
  const [exercises, setExercises] = useState([])
  const [detailedResults, setDetailedResults] = useState([])
  const [academicPeriods, setAcademicPeriods] = useState([])

  /* ── UI state ── */
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('students')

  /* ── Data loading ── */
  const loadAll = useCallback(async () => {
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
      const normalizedEnrollments = normalizeEnrollmentsResponse(results[1].data, user?.role)
      const apiEnrollmentCount = Number(results[1]?.data?.count)
      setEnrollments(normalizedEnrollments)
      if (Number.isFinite(apiEnrollmentCount) && apiEnrollmentCount >= 0) {
        setEnrollmentCount(apiEnrollmentCount)
      } else {
        setEnrollmentCount(normalizedEnrollments.length)
      }
      setDash(results[2].data)
      setExercises(unwrapListData(results[3].data))
      setDetailedResults(unwrapListData(results[4].data))
      if (results[5]) {
        setAcademicPeriods(unwrapListData(results[5].data))
      }
    } catch {
      setError('No se pudo cargar la informacion completa de la materia. Revisa tu acceso a esta institucion e intentalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }, [id, user?.role])

  useEffect(() => { loadAll() }, [loadAll])

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

  const teacherEnrollmentCount = user?.role === 'TEACHER' ? enrollmentCount : null

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
            {user?.role === 'TEACHER' && (
              <p className="notice" style={{ marginTop: 'var(--space-xs)' }}>
                Solo podés ver la cantidad de estudiantes inscriptos.
              </p>
            )}
          </div>
          <div className="subject-hero__stats">
            <div className="stat-card" style={{ minWidth: 100 }}>
              <div className="stat-value">{user?.role === 'TEACHER' ? (teacherEnrollmentCount ?? 0) : enrollments.length}</div>
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
                        <strong>
                          <Link
                            to={`/subjects/${id}/exercises/${item.id}`}
                            style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                          >
                            {item.name}
                          </Link>
                        </strong>
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
                        <Link
                          to={`/subjects/${id}/exercises/${item.id}`}
                          className="btn secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: 'var(--font-size-sm)' }}
                        >
                          Ver detalle
                        </Link>
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
              enrollmentCount={enrollmentCount}
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

    </div>
  )
}
