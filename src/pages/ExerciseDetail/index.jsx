import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import TeacherSubmissionsSection from './TeacherSubmissionsSection'
import StudentSubmissionSection from './StudentSubmissionSection'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'

const TEACHER_ROLES = new Set(['TEACHER', 'ADMIN', 'TUTOR'])

function buildDeadlineLabel(exercise) {
  if (!exercise?.deadline) return 'Sin fecha límite'

  const dateLabel = new Date(exercise.deadline).toLocaleString('es-CO')
  if (exercise.deadline_status === 'OVERDUE') return `Vencido · ${dateLabel}`
  if (exercise.deadline_status === 'URGENT') return `Vence pronto · ${dateLabel}`
  return `Entrega: ${dateLabel}`
}

export default function ExerciseDetailPage() {
  const { subjectId, exerciseId } = useParams()
  const { user } = useAuth()

  const [subject, setSubject] = useState(null)
  const [exercise, setExercise] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [subjectRes, exerciseRes, resultsRes] = await Promise.all([
        api.get(`/api/v1/courses/subjects/${subjectId}/`),
        api.get(`/api/v1/courses/exercises/${exerciseId}/`),
        api.get(`/api/v1/courses/results/?exercise=${exerciseId}`),
      ])

      setSubject(subjectRes.data)
      setExercise(exerciseRes.data)
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : [])
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'cargar el detalle del ejercicio',
        fallback: 'No se pudo cargar este ejercicio. Verificá tu acceso e intentá nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }, [subjectId, exerciseId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isTeacherSection = TEACHER_ROLES.has(user?.role)
  const myResult = useMemo(() => {
    if (isTeacherSection || !user?.email) return null
    return results.find((item) => item.student_email === user.email) || null
  }, [isTeacherSection, results, user?.email])

  const handleStudentSubmit = useCallback(
    async (formData) => {
      await api.post(`/api/v1/courses/exercises/${exerciseId}/submit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess('Tu entrega se registró correctamente.')
      await loadData()
    },
    [exerciseId, loadData]
  )

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: 1100, margin: '2rem auto' }}>
        Cargando detalle del ejercicio...
      </div>
    )
  }

  if (error || !exercise || !subject) {
    return (
      <div className="card" style={{ maxWidth: 1100, margin: '2rem auto', color: 'var(--danger)' }}>
        {error || 'No se encontró el ejercicio solicitado.'}
      </div>
    )
  }

  return (
    <div className="subject-detail fade-in">
      <div className="card card--static" style={{ margin: 0 }}>
        <p style={{ marginBottom: 'var(--space-sm)' }}>
          <Link to={`/subjects/${subjectId}`} style={{ color: 'var(--primary)' }}>
            ← Volver a {subject.name}
          </Link>
        </p>
        <h1 style={{ marginBottom: 'var(--space-xs)' }}>{exercise.name}</h1>
        <p className="subject-hero__meta">{subject.name} ({subject.code})</p>
        <p className="notice" style={{ marginTop: 'var(--space-sm)' }}>{buildDeadlineLabel(exercise)}</p>
        {exercise.description ? (
          <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>{exercise.description}</p>
        ) : null}
        {exercise.attachment_download_url ? (
          <a
            href={exercise.attachment_download_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', textDecoration: 'underline' }}
          >
            Descargar archivo adjunto
          </a>
        ) : null}
      </div>

      {success ? (
        <div className="card card--static" style={{ margin: 0, background: 'var(--success)', color: 'white' }}>
          {success}
        </div>
      ) : null}

      {isTeacherSection ? (
        <TeacherSubmissionsSection results={results} />
      ) : (
        <StudentSubmissionSection
          exercise={exercise}
          myResult={myResult}
          onSubmit={handleStudentSubmit}
        />
      )}
    </div>
  )
}
