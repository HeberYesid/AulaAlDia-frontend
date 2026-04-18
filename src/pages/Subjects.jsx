import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
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
  return (
    subject?.teacher?.full_name
    || subject?.teacher?.email
    || subject?.teacher_name
    || subject?.teacher_email
    || 'Sin docente asignado'
  )
}

export default function Subjects() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [items, setItems] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
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

      if (isAdmin) {
        const [subjectsRes, coursesRes, teachersRes] = await Promise.all([
          api.get('/api/v1/courses/subjects/'),
          api.get('/api/v1/courses/courses/'),
          api.get('/api/v1/auth/tenant-users/', {
            params: {
              role: 'TEACHER',
              status: 'active',
            },
          }),
        ])

        setItems(unwrapListData(subjectsRes.data))
        setCourses(unwrapListData(coursesRes.data))
        setTeachers(unwrapListData(teachersRes.data))
        return
      }

      const subjectsRes = await api.get('/api/v1/courses/subjects/')

      setItems(unwrapListData(subjectsRes.data))
      setCourses([])
      setTeachers([])
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudieron cargar las materias. Verifica tu institucion activa e intentalo nuevamente.'
      ))
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isCreateModalOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !submitting) {
        setIsCreateModalOpen(false)
        setName('')
        setCourseId('')
        setTeacherId('')
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isCreateModalOpen, submitting])

  function resetCreateForm() {
    setName('')
    setCourseId('')
    setTeacherId('')
  }

  function openCreateModal() {
    setError('')
    setSuccess('')
    resetCreateForm()
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    resetCreateForm()
  }

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setSubmitting(true)
      await api.post('/api/v1/courses/subjects/', {
        name,
        course_id: Number(courseId),
        teacher_id: Number(teacherId),
      })

      closeCreateModal()
      setSuccess('Materia creada exitosamente')
      await load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo crear la materia. Verifica nombre, curso, docente y tu institucion activa.'
      ))
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteSubject(subject) {
    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/v1/courses/subjects/${subject.id}/`)
      setSuccess(`Materia "${subject.name}" eliminada exitosamente`)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting subject:', err)
      const errorMessage = getApiErrorMessage(err, {
        action: `eliminar la materia ${subject.name}`,
        fallback: 'No se pudo eliminar la materia. Puede tener registros relacionados o permisos restringidos.',
      })
      setError(errorMessage)
    }
  }

  function handleDeleteClick(subject) {
    setConfirmDelete(subject)
  }

  function handleConfirmDelete() {
    const subject = confirmDelete
    setConfirmDelete(null)
    deleteSubject(subject)
  }

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
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar materia?"
          message={`¿Estás seguro de que deseas eliminar la materia "${confirmDelete.name}"? Esta acción eliminará todos los estudiantes inscritos, ejercicios y resultados. Esta acción NO se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {/* Mensajes de éxito/error */}
      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      <div className="admin-page sections-page subjects-page">
        <div className="sections-page__header">
          <h1>Gestión de Materias</h1>
          {isAdmin ? (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Nueva Materia
            </button>
          ) : (
            <p className="subjects-page__helper">Solo administradores pueden crear materias nuevas.</p>
          )}
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
                                    to={`/subjects/${subject.id}`}
                                  >
                                    Ver
                                  </Link>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeleteClick(subject)}
                                      className="btn danger"
                                      type="button"
                                    >
                                      Eliminar
                                    </button>
                                  )}
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

      {isAdmin && isCreateModalOpen && (
        <div className="sections-modal-backdrop" onClick={!submitting ? closeCreateModal : undefined}>
          <div
            className="sections-modal modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subjects-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="subjects-modal-title">Nueva Materia</h2>

            <form onSubmit={createSubject}>
              <div className="form-group">
                <label htmlFor="subject-name">Nombre</label>
                <input
                  id="subject-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Ej: Matemáticas"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject-course">Curso</label>
                <select
                  id="subject-course"
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject-teacher">Docente</label>
                <select
                  id="subject-teacher"
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un docente</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sections-modal__actions">
                <button type="submit" className="btn sections-modal__save" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className="btn sections-modal__cancel"
                  onClick={closeCreateModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
