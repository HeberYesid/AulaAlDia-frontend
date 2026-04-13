import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const INITIAL_FORM = {
  enrollment_id: '',
  answers: {},
}

function scoreColor(value) {
  const numericValue = Number(value || 0)
  if (numericValue >= 4.5) return 'var(--success)'
  if (numericValue >= 3.5) return 'var(--warning)'
  return 'var(--danger)'
}

function answerFieldName(questionId) {
  return `answer-${questionId}`
}

function QuestionInput({ question, value, onChange }) {
  if (question.question_type === 'TEXT') {
    const textValue = value?.text_answer || ''
    return (
      <div className="form-group" key={question.id}>
        <label htmlFor={answerFieldName(question.id)}>
          {question.prompt}
          {question.is_required ? ' *' : ' (opcional)'}
        </label>
        <textarea
          id={answerFieldName(question.id)}
          value={textValue}
          onChange={(event) =>
            onChange(question.id, {
              numeric_score: null,
              text_answer: event.target.value,
            })
          }
          rows={4}
          maxLength={1200}
          placeholder={question.help_text || 'Escribí tu respuesta...'}
          style={{ resize: 'vertical' }}
          required={question.is_required}
        />
        <p className="teacher-eval__char-counter" aria-live="polite">
          {textValue.length}/1200
        </p>
      </div>
    )
  }

  const numericValue = Number(value?.numeric_score || 0)
  return (
    <fieldset className="teacher-eval__rating-group" key={question.id}>
      <legend>
        {question.prompt}
        {question.is_required ? ' *' : ' (opcional)'}
      </legend>
      {question.help_text ? <p className="teacher-eval__question-help">{question.help_text}</p> : null}
      <div className="teacher-eval__stars" role="radiogroup" aria-label={question.prompt}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const checked = numericValue === starValue
          return (
            <label key={`${question.id}-${starValue}`} className="teacher-eval__star-label">
              <input
                type="radio"
                name={answerFieldName(question.id)}
                value={starValue}
                checked={checked}
                onChange={() =>
                  onChange(question.id, {
                    numeric_score: starValue,
                    text_answer: '',
                  })
                }
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

function groupResponsesByType(responses = []) {
  const numeric = responses.filter((item) => item.question_type === 'SCALE_1_5')
  const text = responses.filter((item) => item.question_type === 'TEXT')
  return { numeric, text }
}

function normalizeAnswersForSubmit(questions, answersByQuestionId) {
  return questions.map((question) => {
    const current = answersByQuestionId?.[question.id] || {}
    return {
      question_id: question.id,
      numeric_score:
        question.question_type === 'SCALE_1_5'
          ? Number(current.numeric_score || 0)
          : null,
      text_answer:
        question.question_type === 'TEXT'
          ? (current.text_answer || '').trim()
          : '',
    }
  })
}

function buildInitialAnswers(questions) {
  return questions.reduce((acc, question) => {
    if (question.question_type === 'SCALE_1_5') {
      acc[question.id] = { numeric_score: 5, text_answer: '' }
    } else {
      acc[question.id] = { numeric_score: null, text_answer: '' }
    }
    return acc
  }, {})
}

export default function TeacherEvaluations() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [options, setOptions] = useState([])
  const [myEvaluations, setMyEvaluations] = useState([])
  const [reportData, setReportData] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [adminQuestions, setAdminQuestions] = useState([])
  const [questionForm, setQuestionForm] = useState({
    prompt: '',
    help_text: '',
    question_type: 'SCALE_1_5',
    is_required: true,
    is_active: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedOption = useMemo(
    () => options.find((option) => String(option.enrollment_id) === String(form.enrollment_id)),
    [options, form.enrollment_id],
  )

  const selectedQuestions = useMemo(
    () => (Array.isArray(selectedOption?.questions) ? selectedOption.questions : []),
    [selectedOption],
  )

  const studentSummary = useMemo(() => {
    if (!myEvaluations.length) {
      return {
        total: 0,
        avgOverall: 0,
      }
    }

    const total = myEvaluations.length
    const overall = myEvaluations.reduce((acc, item) => acc + Number(item.overall_score || 0), 0)
    return {
      total,
      avgOverall: Number((overall / total).toFixed(2)),
    }
  }, [myEvaluations])

  async function loadQuestionAdminData() {
    if (!isAdmin) return
    const { data } = await api.get('/api/v1/courses/teacher-evaluation-questions/')
    setAdminQuestions(Array.isArray(data) ? data : [])
  }

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

    setForm((current) => {
      const resolvedEnrollmentId =
        current.enrollment_id &&
        availableOptions.some((item) => String(item.enrollment_id) === String(current.enrollment_id))
          ? current.enrollment_id
          : availableOptions[0]?.enrollment_id || ''

      const selected = availableOptions.find(
        (item) => String(item.enrollment_id) === String(resolvedEnrollmentId),
      )
      const selectedQuestionsSafe = Array.isArray(selected?.questions) ? selected.questions : []

      return {
        enrollment_id: resolvedEnrollmentId,
        answers:
          Object.keys(current.answers || {}).length > 0
            ? current.answers
            : buildInitialAnswers(selectedQuestionsSafe),
      }
    })
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

      if (isAdmin) {
        await loadQuestionAdminData()
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

  function handleEnrollmentChange(event) {
    const enrollmentId = event.target.value
    const selected = options.find((item) => String(item.enrollment_id) === String(enrollmentId))
    const questions = Array.isArray(selected?.questions) ? selected.questions : []

    setForm({
      enrollment_id: enrollmentId,
      answers: buildInitialAnswers(questions),
    })
  }

  function handleAnswerChange(questionId, answer) {
    setForm((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: answer,
      },
    }))
  }

  function handleQuestionFormChange(event) {
    const { name, value, type, checked } = event.target
    setQuestionForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleCreateQuestion(event) {
    event.preventDefault()
    setSavingQuestion(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/api/v1/courses/teacher-evaluation-questions/', {
        prompt: questionForm.prompt.trim(),
        help_text: questionForm.help_text.trim(),
        question_type: questionForm.question_type,
        is_required: Boolean(questionForm.is_required),
        is_active: Boolean(questionForm.is_active),
      })

      setQuestionForm({
        prompt: '',
        help_text: '',
        question_type: 'SCALE_1_5',
        is_required: true,
        is_active: true,
      })

      setSuccess('Pregunta creada correctamente.')
      await loadQuestionAdminData()
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          action: 'crear la pregunta de evaluación',
          fallback: 'No se pudo crear la pregunta. Revisá los datos e intentalo nuevamente.',
        }),
      )
    } finally {
      setSavingQuestion(false)
    }
  }

  async function toggleQuestionState(question) {
    setError('')
    setSuccess('')
    try {
      await api.patch(`/api/v1/courses/teacher-evaluation-questions/${question.id}/`, {
        is_active: !question.is_active,
      })
      setSuccess('Pregunta actualizada correctamente.')
      await loadQuestionAdminData()
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          action: 'actualizar la pregunta',
          fallback: 'No se pudo actualizar la pregunta. Intentá nuevamente.',
        }),
      )
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.enrollment_id) {
      setError('Selecciona una materia para evaluar.')
      return
    }

    if (selectedQuestions.length === 0) {
      setError('No hay preguntas activas para esta evaluación. Contactá al administrador.')
      return
    }

    const answers = normalizeAnswersForSubmit(selectedQuestions, form.answers)

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/api/v1/courses/teacher-evaluations/', {
        enrollment_id: Number(form.enrollment_id),
        answers,
      })

      setForm((current) => ({
        enrollment_id: current.enrollment_id,
        answers: buildInitialAnswers(selectedQuestions),
      }))
      setSuccess('Tu evaluación se envió correctamente. El docente solo verá resultados agregados anónimos.')
      await loadStudentData()
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          action: 'enviar tu evaluación docente',
          fallback: 'No se pudo enviar tu evaluación docente. Revisá los datos e intentalo nuevamente.',
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
        <p className="empty-state__text">
          Esta sección está disponible para estudiantes, docentes y administradores.
        </p>
      </div>
    )
  }

  return (
    <div className="fade-in teacher-eval">
      <div className="card">
        <h1 className="teacher-eval__title">Evaluación Docente</h1>
        <p className="teacher-eval__subtitle">
          {isStudent
            ? 'Evaluá a tus docentes con las preguntas configuradas por tu institución. Tus respuestas son anónimas y se muestran solo de forma agregada.'
            : 'Consultá resultados agregados y anónimos de evaluación docente por materia.'}
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

      {isAdmin ? (
        <div className="card teacher-eval__admin-config">
          <h2 style={{ marginTop: 0 }}>Configuración de preguntas</h2>
          <p className="teacher-eval__subtitle" style={{ marginTop: 0 }}>
            Podés activar/desactivar preguntas preconfiguradas y crear preguntas personalizadas.
          </p>

          <form className="teacher-eval__question-form" onSubmit={handleCreateQuestion}>
            <div className="form-group">
              <label htmlFor="question-prompt">Pregunta</label>
              <input
                id="question-prompt"
                name="prompt"
                value={questionForm.prompt}
                onChange={handleQuestionFormChange}
                maxLength={240}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="question-help">Ayuda (opcional)</label>
              <input
                id="question-help"
                name="help_text"
                value={questionForm.help_text}
                onChange={handleQuestionFormChange}
                maxLength={500}
              />
            </div>
            <div className="teacher-eval__question-form-inline">
              <div className="form-group">
                <label htmlFor="question-type">Tipo</label>
                <select
                  id="question-type"
                  name="question_type"
                  value={questionForm.question_type}
                  onChange={handleQuestionFormChange}
                >
                  <option value="SCALE_1_5">Escala 1 a 5</option>
                  <option value="TEXT">Texto libre</option>
                </select>
              </div>
              <label className="teacher-eval__checkbox-label">
                <input
                  type="checkbox"
                  name="is_required"
                  checked={questionForm.is_required}
                  onChange={handleQuestionFormChange}
                />
                Obligatoria
              </label>
              <label className="teacher-eval__checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={questionForm.is_active}
                  onChange={handleQuestionFormChange}
                />
                Activa
              </label>
            </div>
            <div className="teacher-eval__actions">
              <button type="submit" className="btn primary" disabled={savingQuestion}>
                {savingQuestion ? 'Guardando...' : 'Crear pregunta'}
              </button>
            </div>
          </form>

          <div className="data-table" style={{ marginTop: 'var(--space-md)' }}>
            <table className="table mobile-card-view teacher-eval__table">
              <thead>
                <tr>
                  <th scope="col">Orden</th>
                  <th scope="col">Pregunta</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {adminQuestions.map((question) => (
                  <tr key={question.id}>
                    <td data-label="Orden">{question.display_order}</td>
                    <td data-label="Pregunta">
                      <strong>{question.prompt}</strong>
                      <div className="teacher-eval__meta">
                        {question.code ? `Preconfigurada (${question.code})` : 'Personalizada'}
                      </div>
                    </td>
                    <td data-label="Tipo">
                      {question.question_type === 'SCALE_1_5' ? 'Escala 1-5' : 'Texto libre'}
                    </td>
                    <td data-label="Estado">
                      {question.is_active ? (
                        <span className="badge SCORE">Activa</span>
                      ) : (
                        <span className="badge PENDING">Inactiva</span>
                      )}
                    </td>
                    <td data-label="Acción">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => toggleQuestionState(question)}
                      >
                        {question.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isStudent ? (
        <>
          <div className="stats-grid teacher-eval__stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {options.length}
              </div>
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
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Nueva evaluación</h2>
            {options.length === 0 ? (
              <p className="notice" style={{ marginBottom: 0 }}>
                No tenés materias pendientes por evaluar en el periodo activo.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="teacher-eval__form">
                <div className="form-group">
                  <label htmlFor="evaluation-enrollment">Materia activa</label>
                  <select
                    id="evaluation-enrollment"
                    name="enrollment_id"
                    value={form.enrollment_id}
                    onChange={handleEnrollmentChange}
                    required
                  >
                    <option value="">Seleccioná una materia</option>
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
                  {selectedQuestions.map((question) => (
                    <QuestionInput
                      key={question.id}
                      question={question}
                      value={form.answers?.[question.id]}
                      onChange={handleAnswerChange}
                    />
                  ))}
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
              <div className="teacher-eval__evaluation-list">
                {myEvaluations.map((evaluation) => {
                  const grouped = groupResponsesByType(evaluation.responses)
                  return (
                    <article key={evaluation.id} className="teacher-eval__evaluation-card">
                      <header className="teacher-eval__report-header">
                        <h3>{evaluation.subject_name}</h3>
                        <p>{evaluation.subject_code}</p>
                      </header>
                      <p className="teacher-eval__report-teacher">
                        <strong>Docente:</strong> {evaluation.teacher_name}
                      </p>
                      <div className="teacher-eval__metric-row">
                        <span>Promedio general</span>
                        <strong style={{ color: scoreColor(evaluation.overall_score) }}>
                          {Number(evaluation.overall_score || 0).toFixed(2)}
                        </strong>
                      </div>

                      {grouped.numeric.length > 0 ? (
                        <div className="teacher-eval__metric-grid">
                          {grouped.numeric.map((item) => (
                            <div key={`${evaluation.id}-numeric-${item.question_id}`}>
                              <span>{item.prompt}</span>
                              <strong>{Number(item.numeric_score || 0).toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {grouped.text.length > 0 ? (
                        <section className="teacher-eval__comments">
                          <h4>Respuestas abiertas</h4>
                          <ul>
                            {grouped.text.map((item) => (
                              <li key={`${evaluation.id}-text-${item.question_id}`}>
                                <p>
                                  <strong>{item.prompt}:</strong> {item.text_answer || 'Sin respuesta'}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}

                      <small>
                        {new Date(evaluation.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </small>
                    </article>
                  )
                })}
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

                    {Array.isArray(item.question_metrics) && item.question_metrics.length > 0 ? (
                      <div className="teacher-eval__metric-grid">
                        {item.question_metrics.map((metric) => (
                          <div key={`${item.teacher.id}-${item.subject.code}-${metric.question_id}`}>
                            <span>{metric.prompt}</span>
                            <strong>
                              {metric.avg_score === null || metric.avg_score === undefined
                                ? `${metric.responses_count} respuestas`
                                : Number(metric.avg_score).toFixed(2)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    ) : null}

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
                              <p>
                                {commentItem.question_prompt ? (
                                  <strong>{commentItem.question_prompt}: </strong>
                                ) : null}
                                {commentItem.comment}
                              </p>
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
