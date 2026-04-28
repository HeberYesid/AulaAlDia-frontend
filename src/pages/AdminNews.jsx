import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../api/axios'
import Alert from '../components/Alert'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { unwrapListData } from '../utils/pagination'
import './AdminNews.css'

const NEWS_TYPE_OPTIONS = [
  { value: 'ANNOUNCEMENT', label: 'Anuncio' },
  { value: 'EVENT', label: 'Evento Programado' },
]

const TARGET_SCOPE_OPTIONS = [
  { value: 'ALL', label: 'Toda la institución' },
  { value: 'ROLES', label: 'Por roles' },
  { value: 'COURSES', label: 'Por cursos' },
]

const TARGET_ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Alumnos' },
  { value: 'TUTOR', label: 'Padres' },
  { value: 'TEACHER', label: 'Docentes' },
]

const DEFAULT_FORM_STATE = {
  type: 'ANNOUNCEMENT',
  title: '',
  body: '',
  targetScope: 'ALL',
  targetRoles: [],
  targetCourses: [],
  startTime: '',
  endTime: '',
}

export default function AdminNews() {
  const [feedItems, setFeedItems] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('ANNOUNCEMENT')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetScope, setTargetScope] = useState('ALL')
  const [targetRoles, setTargetRoles] = useState([])
  const [targetCourses, setTargetCourses] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    setError('')

    try {
      const [feedRes, coursesRes] = await Promise.all([
        api.get('/api/v1/courses/calendar/news_feed/'),
        api.get('/api/v1/courses/courses/'),
      ])

      setFeedItems(unwrapListData(feedRes.data))
      setAvailableCourses(unwrapListData(coursesRes.data))
    } catch (err) {
      console.error(err)
      setError(
        getApiErrorMessage(err, {
          action: 'cargar novedades institucionales',
          fallback: 'No se pudo cargar la informacion de novedades. Intentalo nuevamente.',
        })
      )
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function resetFormState() {
    setSelectedType(DEFAULT_FORM_STATE.type)
    setTitle(DEFAULT_FORM_STATE.title)
    setBody(DEFAULT_FORM_STATE.body)
    setTargetScope(DEFAULT_FORM_STATE.targetScope)
    setTargetRoles(DEFAULT_FORM_STATE.targetRoles)
    setTargetCourses(DEFAULT_FORM_STATE.targetCourses)
    setStartTime(DEFAULT_FORM_STATE.startTime)
    setEndTime(DEFAULT_FORM_STATE.endTime)
  }

  function openModal() {
    setError('')
    setSuccess('')
    resetFormState()
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    resetFormState()
  }

  function toggleRole(role) {
    setTargetRoles((current) => {
      if (current.includes(role)) {
        return current.filter((item) => item !== role)
      }

      return [...current, role]
    })
  }

  function toggleCourse(courseId) {
    const normalizedCourseId = Number(courseId)
    setTargetCourses((current) => {
      if (current.includes(normalizedCourseId)) {
        return current.filter((item) => item !== normalizedCourseId)
      }

      return [...current, normalizedCourseId]
    })
  }

  function handleTypeChange(nextType) {
    setSelectedType(nextType)
    if (nextType === 'ANNOUNCEMENT') {
      setStartTime('')
      setEndTime('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const endpoint = selectedType === 'EVENT'
        ? '/api/v1/courses/calendar/'
        : '/api/v1/courses/announcements/'

      const payload = selectedType === 'EVENT'
        ? {
            title,
            description: body,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            event_type: 'OTHER',
            target_scope: targetScope,
            target_roles: targetScope === 'ROLES' ? targetRoles : [],
            target_courses: targetScope === 'COURSES' ? targetCourses : [],
            subject: null,
            course_subject: null,
          }
        : {
            title,
            content: body,
            is_active: true,
            target_scope: targetScope,
            target_roles: targetScope === 'ROLES' ? targetRoles : [],
            target_courses: targetScope === 'COURSES' ? targetCourses : [],
          }

      await api.post(endpoint, payload)
      setSuccess('Publicación guardada exitosamente.')
      closeModal()
      await loadData()
    } catch (err) {
      console.error(err)
      setError(
        getApiErrorMessage(err, {
          action: 'crear la publicación',
          fallback: 'No se pudo guardar la publicación. Verifica titulo, contenido y fechas.',
        })
      )
    }
  }

  const announcementCount = feedItems.filter((item) => item.item_type === 'ANNOUNCEMENT').length
  const eventCount = feedItems.filter((item) => item.item_type === 'EVENT').length

  return (
    <div className="page-container admin-news-page">
      <div className="admin-news__shell">
        <header className="admin-news__hero card">
          <div className="admin-news__hero-copy">
            <p className="admin-news__eyebrow">Novedades institucionales</p>
            <h1 className="admin-news__title">Publicaciones institucionales</h1>
            <p className="admin-news__subtitle">
              Crea anuncios y eventos desde una sola vista. Ambos comparten audiencia, markdown y flujo de creación.
            </p>
          </div>

          <div className="admin-news__hero-actions">
            <button type="button" className="btn primary" onClick={() => openModal()}>
              Crear publicación
            </button>
          </div>

          <div className="admin-news__stats" aria-label="Resumen de publicaciones">
            <article className="admin-news__stat">
              <span className="admin-news__stat-value">{feedItems.length}</span>
              <span className="admin-news__stat-label">Publicaciones visibles</span>
            </article>
            <article className="admin-news__stat">
              <span className="admin-news__stat-value">{announcementCount}</span>
              <span className="admin-news__stat-label">Anuncios</span>
            </article>
            <article className="admin-news__stat">
              <span className="admin-news__stat-value">{eventCount}</span>
              <span className="admin-news__stat-label">Eventos programados</span>
            </article>
          </div>
        </header>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        {isModalOpen && (
          <div
            className="admin-news__modal-backdrop"
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeModal()
              }
            }}
          >
            <div className="admin-news__modal" role="dialog" aria-modal="true" aria-labelledby="admin-news-modal-title">
              <form className="admin-news__modal-shell" onSubmit={handleSubmit}>
                <div className="admin-news__modal-header">
                  <div>
                    <p className="admin-news__eyebrow">Crear publicación</p>
                    <h2 id="admin-news-modal-title" className="admin-news__modal-title">
                      Nueva publicación
                    </h2>
                    <p className="admin-news__modal-copy">
                      El contenido admite Markdown básico y se sanitiza antes de renderizarse.
                    </p>
                  </div>

                  <button type="button" className="btn secondary" onClick={closeModal} aria-label="Cerrar modal">
                    Cerrar
                  </button>
                </div>

                <section className="admin-news__type-selector">
                  <label className="admin-news__field-label" htmlFor="news-type-selector">
                    ¿Qué deseas publicar?
                  </label>
                  <div className="admin-news__type-selector-buttons" id="news-type-selector" role="radiogroup" aria-label="Tipo de publicación">
                    {NEWS_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`admin-news__type-button ${selectedType === option.value ? 'admin-news__type-button--active' : ''}`}
                        aria-pressed={selectedType === option.value}
                        onClick={() => handleTypeChange(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.value === 'EVENT' ? 'Inicio / fin y alcance programado' : 'Texto institucional de lectura rápida'}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="admin-news__form-grid">
                  <div className="admin-news__field admin-news__field--wide">
                    <label className="admin-news__field-label" htmlFor="news-title">
                      Título
                    </label>
                    <input
                      id="news-title"
                      className="input-field admin-news__field-control"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-news__field admin-news__field--wide">
                    <label className="admin-news__field-label" htmlFor="news-body">
                      Contenido / Descripción
                    </label>
                    <textarea
                      id="news-body"
                      className="input-field admin-news__field-control admin-news__textarea"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="Escribe en Markdown básico: listas, enlaces, negritas y citas."
                      required
                    />
                  </div>

                  <div className="admin-news__field">
                    <label className="admin-news__field-label" htmlFor="news-scope">
                      Alcance
                    </label>
                    <select
                      id="news-scope"
                      className="input-field admin-news__field-control"
                      value={targetScope}
                      onChange={(event) => setTargetScope(event.target.value)}
                    >
                      {TARGET_SCOPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetScope === 'ROLES' && (
                    <div className="admin-news__field admin-news__field--wide">
                      <label className="admin-news__field-label">Roles destinatarios</label>
                      <div className="admin-news__target-grid" role="group" aria-label="Seleccionar roles destinatarios">
                        {TARGET_ROLE_OPTIONS.map((option) => (
                          <label key={option.value} className="admin-news__target-option">
                            <input
                              type="checkbox"
                              checked={targetRoles.includes(option.value)}
                              onChange={() => toggleRole(option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {targetScope === 'COURSES' && (
                    <div className="admin-news__field admin-news__field--wide">
                      <label className="admin-news__field-label">Cursos destinatarios</label>
                      <div className="admin-news__target-grid admin-news__target-grid--courses" role="group" aria-label="Seleccionar cursos destinatarios">
                        {availableCourses.map((course) => (
                          <label key={course.id} className="admin-news__target-option">
                            <input
                              type="checkbox"
                              checked={targetCourses.includes(Number(course.id))}
                              onChange={() => toggleCourse(course.id)}
                            />
                            <span>{course.display_name || `Curso ${course.id}`}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedType === 'EVENT' && (
                    <div className="admin-news__date-grid admin-news__field--wide">
                      <div className="admin-news__field">
                        <label className="admin-news__field-label" htmlFor="news-start-time">
                          Inicio
                        </label>
                        <input
                          id="news-start-time"
                          type="datetime-local"
                          className="input-field admin-news__field-control"
                          value={startTime}
                          onChange={(event) => setStartTime(event.target.value)}
                          required
                        />
                      </div>

                      <div className="admin-news__field">
                        <label className="admin-news__field-label" htmlFor="news-end-time">
                          Fin
                        </label>
                        <input
                          id="news-end-time"
                          type="datetime-local"
                          className="input-field admin-news__field-control"
                          value={endTime}
                          onChange={(event) => setEndTime(event.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="admin-news__form-actions">
                  <button type="button" onClick={closeModal} className="btn secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}