import { useState, useMemo, useEffect } from 'react'
import { api } from '../../api/axios'
import CSVUpload from '../../components/CSVUpload'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'

export default function StudentsTab({ user, id, enrollments, loadAll, setError, setSuccess }) {
  const [email, setEmail] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [userExistsStatus, setUserExistsStatus] = useState(null)
  const [userExistsInfo, setUserExistsInfo] = useState(null)

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const filteredEnrollments = useMemo(() => {
    if (!studentSearch.trim()) return enrollments
    const search = studentSearch.toLowerCase()
    return enrollments.filter(e =>
      e.student.email.toLowerCase().includes(search) ||
      e.student.first_name.toLowerCase().includes(search) ||
      e.student.last_name.toLowerCase().includes(search) ||
      `${e.student.first_name} ${e.student.last_name}`.toLowerCase().includes(search)
    )
  }, [enrollments, studentSearch])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!email || !email.includes('@')) {
        setUserExistsStatus(null)
        setUserExistsInfo(null)
        return
      }
      setUserExistsStatus('checking')
      try {
        const response = await api.get(`/api/v1/auth/check-user-exists/?email=${encodeURIComponent(email)}`)
        setUserExistsStatus('exists')
        setUserExistsInfo(response.data)
      } catch (err) {
        if (err.response?.status === 404) {
          setUserExistsStatus('not-exists')
          setUserExistsInfo(null)
        } else {
          setUserExistsStatus(null)
          setUserExistsInfo(null)
        }
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [email])

  const handleAddEnrollment = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post(`/api/v1/courses/subjects/${id}/enrollments/`, { student_email: email })
      setSuccess(`Estudiante ${email} inscrito correctamente`)
      setEmail('')
      setUserExistsStatus(null)
      setUserExistsInfo(null)
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.student_email?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        getApiErrorMessage(err, {
          action: 'inscribir al estudiante en la materia',
          fallback: 'No se pudo inscribir al estudiante. Verifica el correo, la materia y tus permisos.',
        })
      setError(errorMsg)
    }
  }

  return (
    <div className="tab-sections" role="tabpanel" aria-labelledby="tab-students">
      {/* ── Student List ── */}
      <div className="card card--static section-card">
        <div className="section-header">
          <h3>Estudiantes Inscritos ({enrollments.length})</h3>
        </div>

        {enrollments.length > 0 && (
          <div className="search-bar" style={{ marginBottom: 'var(--space-md)' }}>
            <input
              type="text"
              aria-label="Buscar estudiante por email, nombre o apellido"
              placeholder="Buscar por email, nombre o apellido…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            {studentSearch && (
              <p className="notice" style={{ marginTop: 'var(--space-sm)' }}>
                Mostrando {filteredEnrollments.length} de {enrollments.length} estudiantes
              </p>
            )}
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No hay estudiantes inscritos</p>
            <p className="empty-state__text">Inscribe al primero usando el formulario de abajo.</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <p className="notice">No se encontraron estudiantes que coincidan con &ldquo;{studentSearch}&rdquo;</p>
        ) : (
          <div className="data-table">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Correo</th>
                  <th>Nombre Completo</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((e, index) => (
                  <tr key={e.id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Correo">{e.student.email}</td>
                    <td data-label="Nombre">{e.student.first_name} {e.student.last_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Enroll Individual Student ── */}
      {isTeacherOrAdmin && (
        <div className="card card--static section-card">
          <div className="section-header">
            <h3>Inscribir Estudiante</h3>
          </div>

          <form onSubmit={handleAddEnrollment} style={{ maxWidth: '500px' }}>
            <div>
              <label htmlFor="enrollment-email">Correo electrónico del estudiante</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="enrollment-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estudiante@ejemplo.com"
                  required
                  style={{ paddingRight: userExistsStatus ? '2.5rem' : undefined }}
                />
                {userExistsStatus === 'checking' && (
                  <span className="input-status"><span className="spinner" style={{ width: 16, height: 16 }} /></span>
                )}
                {userExistsStatus === 'exists' && (
                  <span className="input-status" style={{ color: 'var(--success)' }} title="Usuario encontrado">&#10003;</span>
                )}
                {userExistsStatus === 'not-exists' && (
                  <span className="input-status" style={{ color: 'var(--warning)' }} title="Usuario no encontrado">&#9888;</span>
                )}
              </div>

              {userExistsStatus === 'exists' && userExistsInfo && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  <strong style={{ color: 'var(--success)' }}>Usuario encontrado</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-sm)' }}>
                    {userExistsInfo.first_name} {userExistsInfo.last_name}
                    {userExistsInfo.role && ` · ${userExistsInfo.role === 'STUDENT' ? 'Estudiante' : userExistsInfo.role === 'TEACHER' ? 'Profesor' : 'Admin'}`}
                  </span>
                </div>
              )}

              {userExistsStatus === 'not-exists' && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  <strong style={{ color: 'var(--warning)' }}>Usuario no encontrado</strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', margin: 'var(--space-xs) 0 0 0' }}>
                    Se creará automáticamente una cuenta nueva. El estudiante deberá verificar su email.
                  </p>
                </div>
              )}
            </div>

            <button className="btn" type="submit">
              {userExistsStatus === 'exists' ? 'Inscribir Estudiante Existente' : 'Inscribir Estudiante'}
            </button>
          </form>
        </div>
      )}

      {/* ── CSV Bulk Upload ── */}
      {isTeacherOrAdmin && (
        <div className="card card--static section-card">
          <div className="section-header">
            <h3>Carga Masiva de Estudiantes</h3>
          </div>
          <CSVUpload
            label="Cargar estudiantes desde CSV (columnas: email, first_name, last_name)"
            uploadUrl={`/api/v1/courses/subjects/${id}/enrollments/upload-csv/`}
            onComplete={loadAll}
          />
        </div>
      )}
    </div>
  )
}
