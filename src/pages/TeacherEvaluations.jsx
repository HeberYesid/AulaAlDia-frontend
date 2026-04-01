import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const INITIAL_FORM = {
  enrollment_id: '',
  clarity_score: 5,
  methodology_score: 5,
  engagement_score: 5,
  respect_score: 5,
  comment: '',
}

function StarRatingInput({ id, name, label, value, onChange }) {
  const score = Number(value || 0)

  return (
    <fieldset className="teacher-eval__rating-group">
      <legend>{label}</legend>
      <div className="teacher-eval__stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const checked = score === starValue
          return (
            <label key={`${id}-${starValue}`} className="teacher-eval__star-label">
              <input
                id={`${id}-${starValue}`}
                type="radio"
                name={name}
                value={starValue}
                checked={checked}
                onChange={onChange}
              />
              <span aria-hidden="true" className={checked ? 'is-active' : ''}>
                {checked ? '★' : '☆'}
              </span>
              <span className="sr-only">{starValue} de 5</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function scoreColor(value) {
  const numericValue = Number(value || 0)
  if (numericValue >= 4.5) return 'var(--success)'
  if (numericValue >= 3.5) return 'var(--warning)'
  return 'var(--danger)'
}

export default function TeacherEvaluations() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [options, setOptions] = useState([])
  const [myEvaluations, setMyEvaluations] = useState([])
  const [reportData, setReportData] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedOption = useMemo(
    () => options.find((option) => String(option.enrollment_id) === String(form.enrollment_id)),
    [options, form.enrollment_id],
  )

  const studentSummary = useMemo(() => {
    if (!myEvaluations.length) {
      return {
        total: 0,
        avgOverall: 0,
        avgClarity: 0,
        avgMethodology: 0,
        avgEngagement: 0,
        avgRespect: 0,
      }
    }

    const total = myEvaluations.length
    const totals = myEvaluations.reduce(
      (acc, item) => ({
        overall: acc.overall + Number(item.overall_score || 0),
        clarity: acc.clarity + Number(item.clarity_score || 0),
        methodology: acc.methodology + Number(item.methodology_score || 0),
        engagement: acc.engagement + Number(item.engagement_score || 0),
        respect: acc.respect + Number(item.respect_score || 0),
      }),
      {
        overall: 0,
        clarity: 0,
        methodology: 0,
        engagement: 0,
        respect: 0,
      },
    )

    return {
      total,
      avgOverall: Number((totals.overall / total).toFixed(2)),
      avgClarity: Number((totals.clarity / total).toFixed(2)),
      avgMethodology: Number((totals.methodology / total).toFixed(2)),
      avgEngagement: Number((totals.engagement / total).toFixed(2)),
      avgRespect: Number((totals.respect / total).toFixed(2)),
    }
  }, [myEvaluations])

  async function loadStudentData() {
    const [optionsResponse, myResponse] = await Promise.all([
      api.get('/api/v1/courses/teacher-evaluations/options/'),
      api.get('/api/v1/courses/teacher-evaluations/my/'),
    ])

    const availableOptions = Array.isArray(optionsResponse?.data?.options)
      ? optionsResponse.data.options
      : []
    setOptions(availableOptions)

    const evaluations = Array.isArray(myResponse?.data) ? myResponse.data : []
    setMyEvaluations(evaluations)

    setForm((current) => ({
      ...current,
      enrollment_id:
        current.enrollment_id && availableOptions.some((item) => String(item.enrollment_id) === String(current.enrollment_id))
          ? current.enrollment_id
          : availableOptions[0]?.enrollment_id || '',
    }))
  }

  async function loadReportData() {
    const { data } = await api.get('/api/v1/courses/teacher-evaluations/report/')
    setReportData(data)
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      if (isStudent) {
        await loadStudentData()
      } else if (isTeacherOrAdmin) {
        await loadReportData()
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          action: 'cargar la evaluacion docente',
          fallback: 'No se pudo cargar la evaluacion docente. Intentalo nuevamente en unos minutos.',
        }),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  function handleScoreChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: Number(value) }))
  }

  function handleTextChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.enrollment_id) {
      setError('Selecciona una materia para evaluar.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/api/v1/courses/teacher-evaluations/', {
        enrollment_id: Number(form.enrollment_id),
        clarity_score: Number(form.clarity_score),
        methodology_score: Number(form.methodology_score),
        engagement_score: Number(form.engagement_score),
        respect_score: Number(form.respect_score),
        comment: form.comment.trim(),
      })

      setForm({
        ...INITIAL_FORM,
      })
      setSuccess('Tu evaluacion se envio correctamente. El docente solo vera resultados agregados anonimos.')
      await loadStudentData()
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          action: 'enviar tu evaluacion docente',
          fallback: 'No se pudo enviar tu evaluacion docente. Revisa los datos e intentalo nuevamente.',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading" role="status" aria-label="Cargando evaluación docente...">
          <div className="spinner" aria-hidden="true"></div>
          <span aria-hidden="true">Cargando evaluación docente...</span>
        </div>
      </div>
    )
  }

  if (!isStudent && !isTeacherOrAdmin) {
    return (
      <div className="card empty-state">
        <h3 className="empty-state__title">Evaluación docente no disponible</h3>
        <p className="empty-state__text">Esta sección está disponible para estudiantes, docentes y administradores.</p>
      </div>
    )
  }

  return (
    <div className="fade-in teacher-eval">
      <div className="card">
        <h1 className="teacher-eval__title">Evaluación Docente</h1>
        <p className="teacher-eval__subtitle">
          {isStudent
            ? 'Evalúa a tus profesores en materias activas. Tus respuestas son anónimas y se muestran solo en forma agregada.'
            : 'Consulta resultados agregados y anónimos de evaluación docente por materia.'}
        </p>
      </div>

      {error ? (
        <div className="alert error" role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="alert success" role="status" aria-live="polite">
          {success}
        </div>
      ) : null}

      {isStudent ? (
        <>
          <div className="stats-grid teacher-eval__stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{options.length}</div>
              <div className="stat-label">Pendientes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{studentSummary.total}</div>
              <div className="stat-label">Enviadas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: scoreColor(studentSummary.avgOverall) }}>
                {studentSummary.avgOverall.toFixed(2)}
              </div>
              <div className="stat-label">Promedio General</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: scoreColor(studentSummary.avgRespect) }}>
                {studentSummary.avgRespect.toFixed(2)}
              </div>
              <div className="stat-label">Respeto</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Nueva evaluación</h2>
            {options.length === 0 ? (
              <p className="notice" style={{ marginBottom: 0 }}>
                No tienes materias pendientes por evaluar en el periodo activo.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="teacher-eval__form">
                <div className="form-group">
                  <label htmlFor="evaluation-enrollment">Materia activa</label>
                  <select
                    id="evaluation-enrollment"
                    name="enrollment_id"
                    value={form.enrollment_id}
                    onChange={handleTextChange}
                    required
                  >
                    <option value="">Selecciona una materia</option>
                    {options.map((option) => (
                      <option key={option.enrollment_id} value={option.enrollment_id}>
                        {option.subject_name} ({option.subject_code}) - {option.teacher_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOption ? (
                  <div className="teacher-eval__selected-context" aria-live="polite">
                    <strong>Docente:</strong> {selectedOption.teacher_name}
                    <br />
                    <strong>Materia:</strong> {selectedOption.subject_name} ({selectedOption.subject_code})
                  </div>
                ) : null}

                <div className="teacher-eval__ratings-grid">
                  <StarRatingInput
                    id="clarity-score"
                    name="clarity_score"
                    label="Claridad al explicar"
                    value={form.clarity_score}
                    onChange={handleScoreChange}
                  />
                  <StarRatingInput
                    id="methodology-score"
                    name="methodology_score"
                    label="Metodología"
                    value={form.methodology_score}
                    onChange={handleScoreChange}
                  />
                  <StarRatingInput
                    id="engagement-score"
                    name="engagement_score"
                    label="Motivación y acompañamiento"
                    value={form.engagement_score}
                    onChange={handleScoreChange}
                  />
                  <StarRatingInput
                    id="respect-score"
                    name="respect_score"
                    label="Respeto y trato"
                    value={form.respect_score}
                    onChange={handleScoreChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="evaluation-comment">Comentario (opcional)</label>
                  <textarea
                    id="evaluation-comment"
                    name="comment"
                    value={form.comment}
                    onChange={handleTextChange}
                    rows={4}
                    maxLength={1200}
                    placeholder="Comparte una observación que ayude a mejorar (máx. 1200 caracteres)."
                    style={{ resize: 'vertical' }}
                  />
                  <p className="teacher-eval__char-counter" aria-live="polite">
                    {form.comment.length}/1200
                  </p>
                </div>

                <div className="teacher-eval__actions">
                  <button type="submit" className="btn primary" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar evaluación'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Mis evaluaciones enviadas</h2>
            {myEvaluations.length === 0 ? (
              <p className="notice" style={{ marginBottom: 0 }}>
                Aún no has enviado evaluaciones.
              </p>
            ) : (
              <div className="data-table">
                <table className="table mobile-card-view teacher-eval__table">
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Materia</th>
                      <th scope="col">Docente</th>
                      <th scope="col">Promedio</th>
                      <th scope="col">Comentario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEvaluations.map((evaluation) => (
                      <tr key={evaluation.id}>
                        <td data-label="Fecha">
                          {new Date(evaluation.created_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td data-label="Materia">
                          <strong>{evaluation.subject_name}</strong>
                          <div className="teacher-eval__meta">{evaluation.subject_code}</div>
                        </td>
                        <td data-label="Docente">{evaluation.teacher_name}</td>
                        <td data-label="Promedio">
                          <span style={{ color: scoreColor(evaluation.overall_score), fontWeight: 700 }}>
                            {Number(evaluation.overall_score).toFixed(2)}
                          </span>
                        </td>
                        <td data-label="Comentario">{evaluation.comment || 'Sin comentario'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid teacher-eval__stats-grid">
            <div className="stat-card">
              <div className="stat-value">{reportData?.summary?.total_responses || 0}</div>
              <div className="stat-label">Respuestas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: scoreColor(reportData?.summary?.avg_overall || 0) }}>
                {Number(reportData?.summary?.avg_overall || 0).toFixed(2)}
              </div>
              <div className="stat-label">Promedio General</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: scoreColor(reportData?.summary?.avg_clarity || 0) }}>
                {Number(reportData?.summary?.avg_clarity || 0).toFixed(2)}
              </div>
              <div className="stat-label">Claridad</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: scoreColor(reportData?.summary?.avg_respect || 0) }}>
                {Number(reportData?.summary?.avg_respect || 0).toFixed(2)}
              </div>
              <div className="stat-label">Respeto</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Resultados agregados por materia</h2>
            {!Array.isArray(reportData?.results) || reportData.results.length === 0 ? (
              <p className="notice" style={{ marginBottom: 0 }}>
                Aún no hay evaluaciones registradas para mostrar resultados.
              </p>
            ) : (
              <div className="teacher-eval__report-grid">
                {reportData.results.map((item) => (
                  <article key={`${item.teacher.id}-${item.subject.code}`} className="teacher-eval__report-card">
                    <header className="teacher-eval__report-header">
                      <h3>{item.subject.name}</h3>
                      <p>{item.subject.code}</p>
                    </header>
                    <p className="teacher-eval__report-teacher">
                      <strong>Docente:</strong> {item.teacher.name}
                    </p>
                    <div className="teacher-eval__metric-row">
                      <span>Respuestas</span>
                      <strong>{item.metrics.responses_count}</strong>
                    </div>
                    <div className="teacher-eval__metric-row">
                      <span>Promedio general</span>
                      <strong style={{ color: scoreColor(item.metrics.avg_overall) }}>
                        {Number(item.metrics.avg_overall).toFixed(2)}
                      </strong>
                    </div>
                    <div className="teacher-eval__metric-grid">
                      <div>
                        <span>Claridad</span>
                        <strong>{Number(item.metrics.avg_clarity).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span>Metodología</span>
                        <strong>{Number(item.metrics.avg_methodology).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span>Acompañamiento</span>
                        <strong>{Number(item.metrics.avg_engagement).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span>Respeto</span>
                        <strong>{Number(item.metrics.avg_respect).toFixed(2)}</strong>
                      </div>
                    </div>

                    <section className="teacher-eval__comments">
                      <h4>Comentarios anónimos recientes</h4>
                      {item.comments.length === 0 ? (
                        <p className="notice" style={{ marginBottom: 0 }}>
                          Sin comentarios para esta materia.
                        </p>
                      ) : (
                        <ul>
                          {item.comments.map((commentItem, index) => (
                            <li key={`${item.subject.code}-${index}`}>
                              <p>{commentItem.comment}</p>
                              <small>
                                {new Date(commentItem.created_at).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
