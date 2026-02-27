import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Loader2 } from 'lucide-react'
import { api } from '../api/axios'

function gradeStatus(grade) {
  if (grade === null || grade === undefined) return 'RED'
  if (grade >= 4.5) return 'GREEN'
  if (grade >= 3.0) return 'YELLOW'
  return 'RED'
}

const STATUS_LABEL = {
  GREEN: 'Aprobado',
  YELLOW: 'Suficiente',
  RED: 'Reprobado',
}

export default function MySubjects() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/v1/courses/my-enrollments/')
      .then(({ data }) => {
        if (!cancelled) setEnrollments(data.enrollments || [])
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las materias.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="my-subjects">
      <header className="my-subjects__header">
        <BookMarked size={22} strokeWidth={1.75} className="my-subjects__header-icon" />
        <h1 className="my-subjects__title">Mis Materias</h1>
      </header>

      {loading && (
        <div className="my-subjects__loading" aria-live="polite">
          <Loader2 size={24} className="my-subjects__spinner" />
          <span>Cargando materias…</span>
        </div>
      )}

      {!loading && error && (
        <p className="my-subjects__error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <p className="my-subjects__empty">Aún no estás inscrito en ninguna materia.</p>
      )}

      {!loading && !error && enrollments.length > 0 && (
        <ul className="my-subjects__list">
          {enrollments.map((enr) => {
            const grade = enr.stats?.grade ?? null
            const status = gradeStatus(grade)
            return (
              <li key={enr.enrollment_id} className="my-subjects__card">
                <Link
                  to={`/subjects/${enr.subject_id}`}
                  className="my-subjects__card-link"
                  aria-label={`Ver materia ${enr.subject_name}`}
                >
                  <div className="my-subjects__card-body">
                    <p className="my-subjects__subject-code">{enr.subject_code}</p>
                    <p className="my-subjects__subject-name">{enr.subject_name}</p>
                  </div>
                  <span
                    className={`badge ${status} my-subjects__grade-badge`}
                    title={`Nota: ${grade ?? '-'}`}
                  >
                    {grade !== null ? grade.toFixed(1) : '-'} · {STATUS_LABEL[status]}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
