import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import Alert from '../components/Alert'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { unwrapListData } from '../utils/pagination'

function normalizeApiError(error, fallback) {
  return getApiErrorMessage(error, {
    action: 'completar la accion en materias',
    fallback,
  })
}

function resolveSubjectGrade(subject) {
  const gradeLabelFromCourse = subject?.course?.grade_level?.trim?.()
  const gradeLabelFromContext = subject?.course_context?.grade_level?.trim?.()

  return {
    id: subject?.course?.grade_level_id ?? null,
    label: gradeLabelFromCourse || gradeLabelFromContext || 'Sin grado asignado',
  }
}

function resolveSubjectCourse(subject) {
  return subject?.course?.display_name || subject?.course_context?.display_name || 'Sin curso asignado'
}

function resolveSubjectTeacher(subject) {
  const teacherFullName = [subject?.teacher?.first_name, subject?.teacher?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    subject?.teacher?.full_name
    || teacherFullName
    || subject?.teacher_name
    || subject?.teacher?.email
    || subject?.teacher_email
    || 'Sin docente asignado'
  )
}

export default function Subjects() {
  const { user } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openGroupKeys, setOpenGroupKeys] = useState(new Set())

  const subjectsByGrade = useMemo(() => {
    const grouped = new Map()

    items.forEach((subject) => {
      const grade = resolveSubjectGrade(subject)
      const key = grade.id != null ? `grade-${grade.id}` : `label-${grade.label.toLowerCase()}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          id: grade.id,
          label: grade.label,
          subjects: [],
        })
      }

      grouped.get(key).subjects.push(subject)
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.id != null && b.id != null) return a.id - b.id
      if (a.id != null) return -1
      if (b.id != null) return 1
      return a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' })
    })
  }, [items])

  useEffect(() => {
    setOpenGroupKeys((prevOpenKeys) => {
      if (subjectsByGrade.length === 0) {
        return new Set()
      }

      const availableKeys = new Set(subjectsByGrade.map((group) => group.key))
      const nextOpenKeys = new Set()

      prevOpenKeys.forEach((key) => {
        if (availableKeys.has(key)) {
          nextOpenKeys.add(key)
        }
      })

      if (nextOpenKeys.size === 0) {
        nextOpenKeys.add(subjectsByGrade[0].key)
      }

      return nextOpenKeys
    })
  }, [subjectsByGrade])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const subjectsRes = await api.get('/api/v1/courses/course-subjects/')
      setItems(unwrapListData(subjectsRes.data))
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudieron cargar las materias. Verifica tu institucion activa e intentalo nuevamente.'
      ))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleGradeGroupToggle(groupKey, isOpen) {
    setOpenGroupKeys((prevOpenKeys) => {
      const isAlreadyOpen = prevOpenKeys.has(groupKey)
      if ((isOpen && isAlreadyOpen) || (!isOpen && !isAlreadyOpen)) {
        return prevOpenKeys
      }

      const nextOpenKeys = new Set(prevOpenKeys)
      if (isOpen) {
        nextOpenKeys.add(groupKey)
      } else {
        nextOpenKeys.delete(groupKey)
      }
      return nextOpenKeys
    })
  }

  function expandAllGradeGroups() {
    setOpenGroupKeys(new Set(subjectsByGrade.map((group) => group.key)))
  }

  function collapseAllGradeGroups() {
    setOpenGroupKeys(new Set())
  }

  return (
    <div>
      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      <div className="admin-page sections-page subjects-page">
        <div className="sections-page__header">
          <h1>Gestión de Materias</h1>
          <p className="subjects-page__helper">
            Las materias se generan automáticamente desde las mallas asignadas a cada curso.
          </p>
        </div>

        <div className="card sections-page__list-card">
          <div className="sections-page__list-header subjects-page__list-header">
            <h2>Listado por grado</h2>
            {!loading && subjectsByGrade.length > 0 && (
              <div className="subjects-by-grade-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={expandAllGradeGroups}
                  disabled={openGroupKeys.size === subjectsByGrade.length}
                >
                  Expandir todos
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={collapseAllGradeGroups}
                  disabled={openGroupKeys.size === 0}
                >
                  Contraer todos
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="subjects-page__status">Cargando materias...</p>
          ) : items.length === 0 ? (
            <p className="subjects-page__status">No hay materias registradas.</p>
          ) : (
            <div className="subjects-by-grade">
              {subjectsByGrade.map((group) => (
                <details
                  key={group.key}
                  className="subjects-grade-group"
                  open={openGroupKeys.has(group.key)}
                  onToggle={(event) =>
                    handleGradeGroupToggle(group.key, event.currentTarget.open)
                  }
                >
                  <summary className="subjects-grade-summary">
                    <span>{group.label}</span>
                    <span className="subjects-grade-count">
                      {group.subjects.length} {group.subjects.length === 1 ? 'materia' : 'materias'}
                    </span>
                  </summary>

                  <div className="subjects-grade-content">
                    <div className="table-container sections-table-container">
                      <table className="table mobile-card-view sections-table subjects-table">
                        <thead>
                          <tr>
                            <th scope="col">Nombre</th>
                            <th scope="col">Curso</th>
                            <th scope="col">Docente</th>
                            <th scope="col">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.subjects.map((subject) => (
                            <tr key={subject.id}>
                              <td data-label="Nombre">{subject.name}</td>
                              <td data-label="Curso">{resolveSubjectCourse(subject)}</td>
                              <td data-label="Docente">{resolveSubjectTeacher(subject)}</td>
                              <td data-label="Acciones">
                                <div className="subjects-table__actions">
                                  <Link
                                    className="btn secondary"
                                    to={`/subjects/-${subject.id}`}
                                  >
                                    Ver
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
