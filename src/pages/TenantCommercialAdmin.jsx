import { Fragment, useMemo, useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'

const PLAN_OPTIONS = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

function normalizeApiErrors(error) {
  const payload = error?.response?.data
  if (!payload || typeof payload !== 'object') {
    return 'No se pudo procesar la solicitud.'
  }

  if (payload.detail && typeof payload.detail === 'string') {
    return payload.detail
  }

  const lines = []
  Object.entries(payload).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      lines.push(`${field}: ${value.join(' ')}`)
      return
    }
    lines.push(`${field}: ${String(value)}`)
  })

  return lines.join(' | ')
}

export default function TenantCommercialAdmin() {
  const { user, tenants, activeTenantId } = useAuth()
  const [tenantId, setTenantId] = useState(activeTenantId || '')
  const [supportStatus, setSupportStatus] = useState(null)
  const [supportReason, setSupportReason] = useState('')
  const [supportDuration, setSupportDuration] = useState(30)
  const [commercial, setCommercial] = useState(null)
  const [audits, setAudits] = useState([])
  const [plan, setPlan] = useState('SCHOOL')
  const [maxSubjects, setMaxSubjects] = useState('')
  const [maxStudents, setMaxStudents] = useState('')
  const [maxTeachers, setMaxTeachers] = useState('')
  const [maxMembers, setMaxMembers] = useState('')
  const [reason, setReason] = useState('')
  const [resetDefaults, setResetDefaults] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingSupport, setLoadingSupport] = useState(false)
  const [loadingCommercial, setLoadingCommercial] = useState(false)
  const [savingCommercial, setSavingCommercial] = useState(false)
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [auditLimit, setAuditLimit] = useState(20)
  const [auditActorEmail, setAuditActorEmail] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditOrder, setAuditOrder] = useState('desc')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [auditOffset, setAuditOffset] = useState(0)
  const [auditTotalCount, setAuditTotalCount] = useState(0)
  const [expandedAuditId, setExpandedAuditId] = useState(null)

  const tenantOptions = useMemo(() => {
    if (!Array.isArray(tenants)) return []
    return tenants
      .filter((item) => item?.tenant_id)
      .map((item) => ({
        id: item.tenant_id,
        label: `${item.tenant_name} (${item.tenant_slug})`,
      }))
  }, [tenants])

  const isGlobalAdmin = Boolean(user?.role === 'ADMIN' && user?.is_global_admin)

  function resetMessages() {
    setError('')
    setSuccess('')
  }

  function applyCommercialState(payload) {
    setCommercial(payload)
    setPlan(payload.plan || 'SCHOOL')
    setMaxSubjects(payload.max_subjects ?? '')
    setMaxStudents(payload.max_students ?? '')
    setMaxTeachers(payload.max_teachers ?? '')
    setMaxMembers(payload.max_members ?? '')
  }

  async function loadSupportStatus() {
    setLoadingSupport(true)
    resetMessages()
    try {
      const { data } = await api.get('/api/v1/auth/support-access/session/')
      setSupportStatus(data)
    } catch (err) {
      setError(normalizeApiErrors(err))
    } finally {
      setLoadingSupport(false)
    }
  }

  async function activateSupportSession() {
    setLoadingSupport(true)
    resetMessages()
    try {
      const { data } = await api.post('/api/v1/auth/support-access/session/', {
        action: 'ACTIVATE',
        reason: supportReason,
        duration_minutes: Number(supportDuration),
      })
      setSupportStatus({
        ...supportStatus,
        is_support_access_active: data.is_support_access_active,
        support_access_expires_at: data.support_access_expires_at,
      })
      setSuccess(data.message || 'Sesión de soporte activada.')
    } catch (err) {
      setError(normalizeApiErrors(err))
    } finally {
      setLoadingSupport(false)
    }
  }

  async function revokeSupportSession() {
    setLoadingSupport(true)
    resetMessages()
    try {
      const { data } = await api.post('/api/v1/auth/support-access/session/', {
        action: 'REVOKE',
        reason: supportReason,
      })
      setSupportStatus({
        ...supportStatus,
        is_support_access_active: data.is_support_access_active,
        support_access_expires_at: data.support_access_expires_at,
      })
      setSuccess(data.message || 'Sesión de soporte revocada.')
    } catch (err) {
      setError(normalizeApiErrors(err))
    } finally {
      setLoadingSupport(false)
    }
  }

  async function loadCommercialConfig() {
    if (!tenantId) {
      setError('Debes indicar un tenant_id (UUID).')
      return
    }

    setLoadingCommercial(true)
    resetMessages()
    try {
      const { data } = await api.get(`/api/v1/auth/tenants/${tenantId}/commercial/`)
      applyCommercialState(data)
      setAuditOffset(0)
      await loadCommercialAudits(20, false, 0)
      setSuccess('Configuración comercial cargada.')
    } catch (err) {
      setError(normalizeApiErrors(err))
      setCommercial(null)
      setAudits([])
      setAuditTotalCount(0)
    } finally {
      setLoadingCommercial(false)
    }
  }

  async function loadCommercialAudits(limit = auditLimit, clearMessages = true, offset = auditOffset) {
    if (!tenantId) {
      return
    }

    setLoadingAudits(true)
    if (clearMessages) {
      resetMessages()
    }

    try {
      const { data } = await api.get(
        `/api/v1/auth/tenants/${tenantId}/commercial-audits/`,
        {
          params: {
            limit,
            offset,
            actor_email: auditActorEmail || undefined,
            action: auditAction || undefined,
            order: auditOrder,
            date_from: auditDateFrom || undefined,
            date_to: auditDateTo || undefined,
          },
        }
      )
      setAudits(Array.isArray(data?.results) ? data.results : [])
      setAuditOffset(data?.offset || 0)
      setAuditTotalCount(data?.total_count || 0)
      setExpandedAuditId(null)
    } catch (err) {
      setError(normalizeApiErrors(err))
      setAudits([])
      setAuditTotalCount(0)
    } finally {
      setLoadingAudits(false)
    }
  }

  async function applyAuditFilters() {
    await loadCommercialAudits(auditLimit, true, 0)
  }

  async function goToPreviousAuditPage() {
    const previousOffset = Math.max(0, auditOffset - auditLimit)
    await loadCommercialAudits(auditLimit, true, previousOffset)
  }

  async function goToNextAuditPage() {
    const nextOffset = auditOffset + auditLimit
    await loadCommercialAudits(auditLimit, true, nextOffset)
  }

  function exportAuditsJson() {
    if (!audits.length) {
      setError('No hay auditoría para exportar.')
      return
    }

    const exportData = {
      tenant_id: tenantId,
      exported_at: new Date().toISOString(),
      filters: {
        limit: auditLimit,
        actor_email: auditActorEmail || null,
        action: auditAction || null,
        order: auditOrder,
        date_from: auditDateFrom || null,
        date_to: auditDateTo || null,
      },
      results: audits,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tenant-commercial-audits-${tenantId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async function saveCommercialConfig(event) {
    event.preventDefault()
    if (!tenantId) {
      setError('Debes indicar un tenant_id (UUID).')
      return
    }

    setSavingCommercial(true)
    resetMessages()
    try {
      const payload = {
        plan,
        max_subjects: maxSubjects === '' ? null : Number(maxSubjects),
        max_students: maxStudents === '' ? null : Number(maxStudents),
        max_teachers: maxTeachers === '' ? null : Number(maxTeachers),
        max_members: maxMembers === '' ? null : Number(maxMembers),
        reset_to_plan_defaults: resetDefaults,
        reason,
      }
      const { data } = await api.patch(
        `/api/v1/auth/tenants/${tenantId}/commercial/`,
        payload
      )
      applyCommercialState(data.tenant)
      setAuditOffset(0)
      await loadCommercialAudits(20, false, 0)
      setSuccess(data.message || 'Configuración comercial actualizada.')
      setResetDefaults(false)
    } catch (err) {
      setError(normalizeApiErrors(err))
    } finally {
      setSavingCommercial(false)
    }
  }

  if (!isGlobalAdmin) {
    return (
      <div className="card">
        <h2>Acceso restringido</h2>
        <p>Esta sección está disponible solo para administradores globales.</p>
      </div>
    )
  }

  return (
    <div className="commercial-admin">
      <div className="card">
        <h2>Operación Comercial por Tenant</h2>
        <p className="notice">
          Gestiona plan y cuotas por tenant. El endpoint requiere sesión de soporte global activa.
        </p>
      </div>

      {success ? <div className="alert success">{success}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="grid cols-2 grid-stack-mobile">
        <div className="card">
          <h3>Sesión de Soporte (Break-Glass)</h3>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <button className="btn secondary" type="button" onClick={loadSupportStatus} disabled={loadingSupport}>
              {loadingSupport ? 'Consultando...' : 'Consultar estado'}
            </button>
          </div>

          <p>
            Estado actual:{' '}
            <strong>
              {supportStatus?.is_support_access_active ? 'Activo' : 'Inactivo'}
            </strong>
          </p>
          <p className="notice">
            Expira en: {supportStatus?.support_access_expires_at || 'N/A'}
          </p>

          <div className="form-group">
            <label htmlFor="support-reason">Motivo (auditoría)</label>
            <textarea
              id="support-reason"
              value={supportReason}
              onChange={(event) => setSupportReason(event.target.value)}
              rows={3}
              placeholder="Ej: mantenimiento comercial autorizado"
            />
          </div>

          <div className="form-group">
            <label htmlFor="support-duration">Duración en minutos</label>
            <input
              id="support-duration"
              type="number"
              min={1}
              max={240}
              value={supportDuration}
              onChange={(event) => setSupportDuration(event.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button className="btn" type="button" onClick={activateSupportSession} disabled={loadingSupport}>
              Activar
            </button>
            <button className="btn danger" type="button" onClick={revokeSupportSession} disabled={loadingSupport}>
              Revocar
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Seleccionar Tenant</h3>
          <div className="form-group">
            <label htmlFor="tenant-preset">Desde mis tenants</label>
            <select
              id="tenant-preset"
              value={tenantOptions.some((x) => x.id === tenantId) ? tenantId : ''}
              onChange={(event) => setTenantId(event.target.value)}
            >
              <option value="">Selecciona un tenant</option>
              {tenantOptions.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tenant-id-input">Tenant ID (UUID)</label>
            <input
              id="tenant-id-input"
              type="text"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value.trim())}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <button className="btn secondary" type="button" onClick={loadCommercialConfig} disabled={loadingCommercial}>
            {loadingCommercial ? 'Cargando...' : 'Cargar configuración comercial'}
          </button>

          {commercial ? (
            <p className="notice" style={{ marginTop: 'var(--space-md)' }}>
              Tenant cargado: <strong>{commercial.name}</strong> ({commercial.slug})
            </p>
          ) : null}
        </div>
      </div>

      <div className="card">
        <h3>Editar Plan y Cuotas</h3>
        <form onSubmit={saveCommercialConfig}>
          <div className="grid cols-2 grid-stack-mobile">
            <div className="form-group">
              <label htmlFor="plan">Plan</label>
              <select id="plan" value={plan} onChange={(event) => setPlan(event.target.value)}>
                {PLAN_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="max-subjects">Max materias</label>
              <input
                id="max-subjects"
                type="number"
                min={0}
                value={maxSubjects}
                onChange={(event) => setMaxSubjects(event.target.value)}
                placeholder="Vacío/null o 0 = sin límite"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max-students">Max estudiantes</label>
              <input
                id="max-students"
                type="number"
                min={0}
                value={maxStudents}
                onChange={(event) => setMaxStudents(event.target.value)}
                placeholder="Vacío/null o 0 = sin límite"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max-teachers">Max docentes</label>
              <input
                id="max-teachers"
                type="number"
                min={0}
                value={maxTeachers}
                onChange={(event) => setMaxTeachers(event.target.value)}
                placeholder="Vacío/null o 0 = sin límite"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max-members">Max miembros</label>
              <input
                id="max-members"
                type="number"
                min={0}
                value={maxMembers}
                onChange={(event) => setMaxMembers(event.target.value)}
                placeholder="Vacío/null o 0 = sin límite"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="commercial-reason">Motivo del cambio (auditoría)</label>
            <textarea
              id="commercial-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              required
              minLength={10}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <input
              type="checkbox"
              checked={resetDefaults}
              onChange={(event) => setResetDefaults(event.target.checked)}
            />
            Reaplicar cuotas por defecto del plan antes de guardar
          </label>

          <button className="btn" type="submit" disabled={savingCommercial || !tenantId}>
            {savingCommercial ? 'Guardando...' : 'Guardar configuración comercial'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Auditoría Comercial Reciente</h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              className="btn secondary"
              type="button"
              onClick={() => loadCommercialAudits(auditLimit, true, auditOffset)}
              disabled={loadingAudits || !tenantId}
            >
              {loadingAudits ? 'Recargando...' : 'Recargar auditoría'}
            </button>
          </div>
        </div>

        <div className="grid cols-2 grid-stack-mobile" style={{ marginTop: 'var(--space-md)' }}>
          <div className="form-group">
            <label htmlFor="audit-limit">Límite</label>
            <select
              id="audit-limit"
              value={auditLimit}
              onChange={(event) => setAuditLimit(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="audit-actor">Actor (email contiene)</label>
            <input
              id="audit-actor"
              type="text"
              value={auditActorEmail}
              onChange={(event) => setAuditActorEmail(event.target.value)}
              placeholder="ej: ops@"
            />
          </div>
          <div className="form-group">
            <label htmlFor="audit-action">Acción</label>
            <select
              id="audit-action"
              value={auditAction}
              onChange={(event) => setAuditAction(event.target.value)}
            >
              <option value="">Todas</option>
              <option value="UPDATE">UPDATE</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="audit-order">Orden fecha</label>
            <select
              id="audit-order"
              value={auditOrder}
              onChange={(event) => setAuditOrder(event.target.value)}
            >
              <option value="desc">Más reciente primero</option>
              <option value="asc">Más antiguo primero</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="audit-date-from">Fecha desde</label>
            <input
              id="audit-date-from"
              type="date"
              value={auditDateFrom}
              onChange={(event) => setAuditDateFrom(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="audit-date-to">Fecha hasta</label>
            <input
              id="audit-date-to"
              type="date"
              value={auditDateTo}
              onChange={(event) => setAuditDateTo(event.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button
            className="btn secondary"
            type="button"
            onClick={applyAuditFilters}
            disabled={loadingAudits || !tenantId}
          >
            Aplicar filtros
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={goToPreviousAuditPage}
            disabled={loadingAudits || auditOffset <= 0}
          >
            Anterior
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={goToNextAuditPage}
            disabled={loadingAudits || (auditOffset + audits.length) >= auditTotalCount}
          >
            Siguiente
          </button>
          <span className="notice" style={{ alignSelf: 'center' }}>
            Mostrando {audits.length ? (auditOffset + 1) : 0}-{auditOffset + audits.length} de {auditTotalCount}
          </span>
        </div>

        {audits.length === 0 ? (
          <p className="notice" style={{ marginTop: 'var(--space-md)' }}>
            No hay cambios comerciales registrados para este tenant.
          </p>
        ) : (
          <div className="table-container" style={{ marginTop: 'var(--space-md)' }}>
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Actor</th>
                  <th>Motivo</th>
                  <th>Cambio</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <Fragment key={audit.id}>
                    <tr>
                      <td data-label="Fecha">{new Date(audit.created_at).toLocaleString()}</td>
                      <td data-label="Actor">{audit.actor_email}</td>
                      <td data-label="Motivo">{audit.reason}</td>
                      <td data-label="Cambio">
                        <code>
                          {`${audit.previous_data?.plan || '-'} -> ${audit.new_data?.plan || '-'}`}
                        </code>
                      </td>
                      <td data-label="Detalle">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() =>
                            setExpandedAuditId(expandedAuditId === audit.id ? null : audit.id)
                          }
                        >
                          {expandedAuditId === audit.id ? 'Ocultar' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                    {expandedAuditId === audit.id ? (
                      <tr>
                        <td colSpan={5}>
                          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                            <div>
                              <strong>Previous Data</strong>
                              <pre>{JSON.stringify(audit.previous_data, null, 2)}</pre>
                            </div>
                            <div>
                              <strong>New Data</strong>
                              <pre>{JSON.stringify(audit.new_data, null, 2)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
