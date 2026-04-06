import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import StudentDashboard from './StudentDashboard'
import Alert from '../components/Alert'
import WelcomePanel from '../components/WelcomePanel'
import ConfirmDialog from '../components/ConfirmDialog'
import SchoolHeader from '../components/SchoolHeader'
import SidebarBanner from '../components/SidebarBanner'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import {
  checkInTeacherAttendance,
  checkOutTeacherAttendance,
  fetchTeacherAttendanceCurrent,
} from '../hooks/useTeacherAttendance'

export default function Dashboard() {
  const {
    user,
    activeTenantId = null,
    tenants = [],
    tenantsLoaded = true,
    switchTenant,
  } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [tenantAccessDenied, setTenantAccessDenied] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [teacherAttendance, setTeacherAttendance] = useState({
    loading: false,
    hasOpenShift: false,
    shift: null,
  })
  const [teacherAttendanceError, setTeacherAttendanceError] = useState('')

  const hasTenantCatalog = Array.isArray(tenants) && tenants.length > 0
  const hasActiveTenant = Boolean(activeTenantId)
  const hasAuthorizedActiveTenant = hasTenantCatalog
    ? tenants.some((tenant) => tenant.tenant_id === activeTenantId)
    : false

  const shouldPromptTenantSelection =
    user.role !== 'STUDENT' && tenantsLoaded && hasTenantCatalog && !hasActiveTenant
  const shouldDenyTenantAccess =
    user.role !== 'STUDENT' &&
    tenantsLoaded &&
    ((hasTenantCatalog && hasActiveTenant && !hasAuthorizedActiveTenant) || tenantAccessDenied)

  async function loadSubjects() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/v1/courses/subjects/')
      setSubjects(data)
      setTenantAccessDenied(false)
    } catch (err) {
      if (err.response?.status === 403) {
        setTenantAccessDenied(true)
        setSubjects([])
        return
      }
      setError(getApiErrorMessage(err, {
        action: 'cargar las materias del panel',
        fallback: 'No se pudieron cargar las materias del panel. Verifica tu institucion activa e intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectTenant() {
    if (!selectedTenantId) {
      setError('Selecciona una institución para continuar.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await switchTenant(selectedTenantId)
      setTenantAccessDenied(false)
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'activar la institucion seleccionada',
        fallback: 'No se pudo activar la institucion seleccionada. Verifica que pertenezcas a esa institucion.',
      }))
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!shouldPromptTenantSelection || selectedTenantId) {
      return
    }

    const defaultTenantId = tenants[0]?.tenant_id || ''
    setSelectedTenantId(defaultTenantId)
  }, [shouldPromptTenantSelection, selectedTenantId, tenants])

  useEffect(() => {
    if (user.role === 'STUDENT' || user.role === 'ADMIN') {
      setLoading(false)
      return
    }

    if (!tenantsLoaded) {
      setLoading(true)
      return
    }

    if (shouldPromptTenantSelection || shouldDenyTenantAccess) {
      setLoading(false)
      return
    }

    loadSubjects()
  }, [user, tenantsLoaded, shouldPromptTenantSelection, shouldDenyTenantAccess, activeTenantId])

  async function loadTeacherAttendance() {
    if (user.role !== 'TEACHER') return
    setTeacherAttendance((prev) => ({ ...prev, loading: true }))
    setTeacherAttendanceError('')
    try {
      const data = await fetchTeacherAttendanceCurrent()
      setTeacherAttendance({
        loading: false,
        hasOpenShift: Boolean(data?.has_open_shift),
        shift: data?.shift || null,
      })
    } catch (err) {
      setTeacherAttendance((prev) => ({ ...prev, loading: false }))
      setTeacherAttendanceError(getApiErrorMessage(err, {
        action: 'cargar el estado de asistencia docente',
        fallback: 'No se pudo cargar tu estado de asistencia docente.',
      }))
    }
  }

  async function handleTeacherCheckIn() {
    setTeacherAttendance((prev) => ({ ...prev, loading: true }))
    setTeacherAttendanceError('')
    try {
      const data = await checkInTeacherAttendance()
      setTeacherAttendance({
        loading: false,
        hasOpenShift: Boolean(data?.shift),
        shift: data?.shift || null,
      })
    } catch (err) {
      setTeacherAttendance((prev) => ({ ...prev, loading: false }))
      setTeacherAttendanceError(getApiErrorMessage(err, {
        action: 'marcar entrada docente',
        fallback: 'No se pudo marcar tu entrada docente.',
      }))
    }
  }

  async function handleTeacherCheckOut() {
    setTeacherAttendance((prev) => ({ ...prev, loading: true }))
    setTeacherAttendanceError('')
    try {
      const data = await checkOutTeacherAttendance()
      setTeacherAttendance({
        loading: false,
        hasOpenShift: Boolean(data?.shift),
        shift: data?.shift || null,
      })
    } catch (err) {
      setTeacherAttendance((prev) => ({ ...prev, loading: false }))
      setTeacherAttendanceError(getApiErrorMessage(err, {
        action: 'marcar salida docente',
        fallback: 'No se pudo marcar tu salida docente.',
      }))
    }
  }

  useEffect(() => {
    if (
      user.role !== 'TEACHER'
      || !tenantsLoaded
      || shouldPromptTenantSelection
      || shouldDenyTenantAccess
    ) {
      return
    }

    loadTeacherAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role, tenantsLoaded, shouldPromptTenantSelection, shouldDenyTenantAccess, activeTenantId])

  // Si es estudiante, mostrar StudentDashboard
  if (user.role === 'STUDENT') {
    return <StudentDashboard />
  }

  if (shouldPromptTenantSelection) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '2rem auto' }}>
        <h2>Select institution</h2>
        <p>Selecciona una institución activa para cargar tu dashboard.</p>
        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
          <label htmlFor="tenant-selector">Institución</label>
          <select
            id="tenant-selector"
            value={selectedTenantId}
            onChange={(event) => setSelectedTenantId(event.target.value)}
          >
            <option value="">Selecciona una institución</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.tenant_display_name || tenant.tenant_name || tenant.tenant_id}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn primary" onClick={handleSelectTenant}>
            Continuar
          </button>
        </div>
      </div>
    )
  }

  if (shouldDenyTenantAccess) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '2rem auto' }}>
        <h2>Access denied</h2>
        <p>You do not have access to this institution.</p>
        <p style={{ color: 'var(--text-secondary)' }}>
          Verifica que la institución activa sea válida para tu cuenta o solicita soporte a un administrador.
        </p>
      </div>
    )
  }

  if (user.role === 'ADMIN' && !loading) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function deleteSubject(subject) {
    setConfirmDialog({
      title: `Eliminar materia "${subject.name}"`,
      message: `Esta acción eliminará todos los estudiantes inscritos, ejercicios y resultados de "${subject.name}". Esta acción NO se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(null)
        setError('')
        setSuccess('')
        try {
          await api.delete(`/api/v1/courses/subjects/${subject.id}/`)
          setSuccess(`Materia "${subject.name}" eliminada exitosamente`)
          loadSubjects()
          setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
          console.error('Error deleting subject:', err)
          setError(getApiErrorMessage(err, {
            action: `eliminar la materia ${subject.name}`,
            fallback: 'No se pudo eliminar la materia. Puede tener informacion relacionada o permisos restringidos.',
          }))
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" role="status" aria-label="Cargando dashboard..."></div>
        <span aria-hidden="true">Cargando dashboard...</span>
      </div>
    )
  }

  if (user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'TUTOR') {
    return (
      <>
      <div className="fade-in">
        <SchoolHeader />

        {user.role === 'TEACHER' && (
          <div className="card">
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>Asistencia Docente</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
              Estado actual: {teacherAttendance.hasOpenShift ? 'Turno abierto' : 'Sin turno abierto'}
            </p>
            {teacherAttendanceError ? <Alert type="error" message={teacherAttendanceError} /> : null}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <button
                className="btn primary"
                onClick={handleTeacherCheckIn}
                disabled={teacherAttendance.loading || teacherAttendance.hasOpenShift}
              >
                Marcar entrada
              </button>
              <button
                className="btn secondary"
                onClick={handleTeacherCheckOut}
                disabled={teacherAttendance.loading || !teacherAttendance.hasOpenShift}
              >
                Marcar salida
              </button>
            </div>
          </div>
        )}
        
        {/* Mensajes de éxito/error */}
        <Alert type="success" message={success} />
        <Alert type="error" message={error} />

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2>{user.role === 'TUTOR' ? 'Materias Vinculadas' : 'Mis Materias'}</h2>
            {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
              <Link to="/subjects" className="btn primary" style={{ textDecoration: 'none' }}>
                Nueva Materia
              </Link>
            )}
          </div>

          {subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>{user.role === 'TUTOR' ? 'No hay materias vinculadas' : 'No tienes materias creadas'}</h3>
              <p>{user.role === 'TUTOR' ? 'Solicita al administrador vincular estudiantes a tu cuenta de acudiente.' : 'Comienza creando tu primera materia para gestionar estudiantes y ejercicios'}</p>
              {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                <Link to="/subjects" className="btn primary" style={{ marginTop: 'var(--space-md)' }}>
                  Crear mi primera materia
                </Link>
              )}
            </div>
          ) : (
            <div className="data-table">
              <table className="table mobile-card-view">
                <caption className="sr-only">Lista de materias</caption>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Estudiantes</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Nombre">{s.name}</td>
                      <td data-label="Estudiantes">{s.enrollments_count || 0}</td>
                      <td data-label="Acciones">
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                          <Link 
                            className="btn secondary" 
                            to={`/subjects/${s.id}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none' }}
                          >
                            Ver Detalles
                          </Link>
                          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                            <button
                              onClick={() => deleteSubject(s)}
                              className="btn danger"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
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
          )}
        </div>

        <WelcomePanel />
        <SidebarBanner />
      </div>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      </>
    )
  }
}
