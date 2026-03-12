import { Fragment, useEffect, useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'ACADEMIC', label: 'Académico' },
  { value: 'USER_MANAGEMENT', label: 'Gestión de usuarios' },
  { value: 'ACCESS', label: 'Accesos y sesiones' },
  { value: 'CONFIGURATION', label: 'Configuración' },
  { value: 'MESSAGING', label: 'Mensajería' },
  { value: 'OTHER', label: 'Otro' },
]

const CATEGORY_LABELS = {
  ACADEMIC: 'Académico',
  USER_MANAGEMENT: 'Gestión de usuarios',
  ACCESS: 'Accesos y sesiones',
  CONFIGURATION: 'Configuración',
  MESSAGING: 'Mensajería',
  OTHER: 'Otro',
}

const TARGET_LABELS = {
  subject: 'Materia',
  exercise: 'Ejercicio',
  result: 'Resultado',
  notification: 'Notificación',
  calendar_event: 'Evento de calendario',
  observation: 'Observación',
  absence: 'Inasistencia',
  academic_period: 'Periodo académico',
  grading_scale: 'Escala de calificación',
  profile: 'Perfil',
  tenant: 'Tenant',
  support_session: 'Sesión de soporte',
  student_tutor_invitation: 'Invitación de acudiente',
  enrollment: 'Matrícula',
}

function normalizeApiErrors(error) {
  const payload = error?.response?.data
  if (!payload || typeof payload !== 'object') {
    const statusCode = error?.response?.status
    const fallbackMessage = error?.message || 'Respuesta inválida del servidor.'
    return statusCode
      ? `No se pudo cargar la auditoría operativa (${statusCode}). ${fallbackMessage}`
      : `No se pudo cargar la auditoría operativa. ${fallbackMessage}`
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

export default function TenantOperationsAudit() {
  const { user, activeTenantId } = useAuth()
  const [allAudits, setAllAudits] = useState([])
  const [audits, setAudits] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [auditActorEmail, setAuditActorEmail] = useState('')
  const [auditCategory, setAuditCategory] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditOrder, setAuditOrder] = useState('desc')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [filtersApplied, setFiltersApplied] = useState(false)
  const [expandedAuditId, setExpandedAuditId] = useState(null)

  const isTenantAdmin = user?.role === 'ADMIN'

  function getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || 'Otro'
  }

  function getTargetLabel(audit) {
    const targetLabel = TARGET_LABELS[audit.target_type] || 'Registro'
    if (!audit.target_id) {
      return targetLabel
    }
    return `${targetLabel} #${audit.target_id}`
  }

  function formatAuditDate(value) {
    return new Date(value).toLocaleString()
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim()
  }

  function applyLocalFilters(sourceAudits, options = {}) {
    const nextFiltersApplied = options.markApplied ?? true
    let filteredAudits = [...sourceAudits]

    if (auditActorEmail.trim()) {
      const actorFilter = normalizeText(auditActorEmail)
      filteredAudits = filteredAudits.filter((audit) =>
        normalizeText(audit.actor_email).includes(actorFilter)
      )
    }

    if (auditCategory) {
      filteredAudits = filteredAudits.filter((audit) => audit.category === auditCategory)
    }

    if (auditSearch.trim()) {
      const searchFilter = normalizeText(auditSearch)
      filteredAudits = filteredAudits.filter((audit) => {
        const searchableValues = [
          audit.summary,
          audit.actor_email,
          audit.path,
          audit.view_name,
          getCategoryLabel(audit.category),
          getTargetLabel(audit),
        ]
        return searchableValues.some((value) => normalizeText(value).includes(searchFilter))
      })
    }

    if (auditDateFrom) {
      filteredAudits = filteredAudits.filter((audit) => audit.created_at.slice(0, 10) >= auditDateFrom)
    }

    if (auditDateTo) {
      filteredAudits = filteredAudits.filter((audit) => audit.created_at.slice(0, 10) <= auditDateTo)
    }

    filteredAudits.sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime()
      const rightTime = new Date(right.created_at).getTime()
      return auditOrder === 'asc' ? leftTime - rightTime : rightTime - leftTime
    })

    setAudits(filteredAudits)
    setFiltersApplied(nextFiltersApplied)
    setExpandedAuditId(null)
  }

  async function loadAudits({ clearError = true } = {}) {
    if (!activeTenantId) {
      setError('No hay un tenant activo seleccionado.')
      return
    }

    setLoading(true)
    if (clearError) {
      setError('')
    }

    try {
      const collectedAudits = []
      let nextOffset = 0
      let hasMore = true

      while (hasMore) {
        const { data } = await api.get('/api/v1/auth/tenant-operation-audits/', {
          params: {
            limit: 100,
            offset: nextOffset,
            order: 'desc',
          },
        })

        const pageResults = Array.isArray(data?.results) ? data.results : []
        collectedAudits.push(...pageResults)

        if (data?.next_offset === null || data?.next_offset === undefined) {
          hasMore = false
        } else {
          nextOffset = data.next_offset
        }
      }

      setAllAudits(collectedAudits)
      applyLocalFilters(collectedAudits, { markApplied: false })
    } catch (requestError) {
      setError(normalizeApiErrors(requestError))
      setAllAudits([])
      setAudits([])
      setFiltersApplied(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isTenantAdmin || !activeTenantId) {
      return
    }
    loadAudits({ clearError: false })
  }, [activeTenantId, isTenantAdmin])

  async function applyFilters() {
    applyLocalFilters(allAudits)
  }

  function clearFilters() {
    setAuditActorEmail('')
    setAuditCategory('')
    setAuditSearch('')
    setAuditOrder('desc')
    setAuditDateFrom('')
    setAuditDateTo('')
    applyLocalFilters(allAudits, { markApplied: false })
  }

  function exportAuditsJson() {
    if (!audits.length) {
      setError('No hay auditoría para exportar.')
      return
    }

    const exportData = {
      tenant_id: activeTenantId,
      exported_at: new Date().toISOString(),
      filters: {
        actor_email: auditActorEmail || null,
        category: auditCategory || null,
        search: auditSearch || null,
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
    link.download = `tenant-operation-audits-${activeTenantId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!isTenantAdmin) {
    return (
      <div className="card">
        <h2>Acceso restringido</h2>
        <p>Esta sección está disponible solo para administradores del tenant.</p>
      </div>
    )
  }

  return (
    <div className="commercial-admin">
      <div className="card">
        <h2>Auditoría Operativa del Tenant</h2>
        <p className="notice">
          Aquí ves una bitácora completa de actividades realizadas en el tenant activo.
        </p>
        <p className="notice">
          Tenant activo: <strong>{activeTenantId || 'No definido'}</strong>
        </p>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>Tabla de Logs del Tenant</h3>
            <p className="notice" style={{ marginTop: '0.35rem' }}>
              Se cargan primero todos los registros y luego puedes filtrar si lo necesitas.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              className="btn secondary"
              type="button"
              onClick={() => loadAudits()}
              disabled={loading || !activeTenantId}
            >
              {loading ? 'Cargando logs...' : 'Recargar logs'}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={exportAuditsJson}
              disabled={!audits.length}
            >
              Exportar JSON
            </button>
          </div>
        </div>

        <div className="grid cols-2 grid-stack-mobile" style={{ marginTop: 'var(--space-md)' }}>
          <div className="form-group">
            <label htmlFor="operation-actor">Actor (email contiene)</label>
            <input
              id="operation-actor"
              type="text"
              value={auditActorEmail}
              onChange={(event) => setAuditActorEmail(event.target.value)}
              placeholder="ej: teacher@"
            />
          </div>

          <div className="form-group">
            <label htmlFor="operation-category">Categoría</label>
            <select
              id="operation-category"
              value={auditCategory}
              onChange={(event) => setAuditCategory(event.target.value)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="operation-search">Buscar por descripción, actor o registro</label>
            <input
              id="operation-search"
              type="text"
              value={auditSearch}
              onChange={(event) => setAuditSearch(event.target.value)}
              placeholder="ej: materia, acudiente, soporte"
            />
          </div>

          <div className="form-group">
            <label htmlFor="operation-order">Orden fecha</label>
            <select
              id="operation-order"
              value={auditOrder}
              onChange={(event) => setAuditOrder(event.target.value)}
            >
              <option value="desc">Más reciente primero</option>
              <option value="asc">Más antiguo primero</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="operation-date-from">Fecha desde</label>
            <input
              id="operation-date-from"
              type="date"
              value={auditDateFrom}
              onChange={(event) => setAuditDateFrom(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="operation-date-to">Fecha hasta</label>
            <input
              id="operation-date-to"
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
            onClick={applyFilters}
            disabled={loading || !activeTenantId || !allAudits.length}
          >
            Aplicar filtros
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={clearFilters}
            disabled={loading || !allAudits.length}
          >
            Quitar filtros
          </button>
          <span className="notice" style={{ alignSelf: 'center' }}>
            {filtersApplied
              ? `Mostrando ${audits.length} de ${allAudits.length} registros filtrados`
              : `Mostrando ${audits.length} registros cargados`}
          </span>
        </div>

        {audits.length === 0 ? (
          <p className="notice" style={{ marginTop: 'var(--space-md)' }}>
            No hay registros para mostrar con los filtros actuales.
          </p>
        ) : (
          <div className="table-container" style={{ marginTop: 'var(--space-md)' }}>
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Quién hizo el cambio</th>
                  <th>Tipo de actividad</th>
                  <th>Qué pasó</th>
                  <th>Registro afectado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <Fragment key={audit.id}>
                    <tr>
                      <td data-label="Fecha">{formatAuditDate(audit.created_at)}</td>
                      <td data-label="Quién hizo el cambio">{audit.actor_email || 'Sistema'}</td>
                      <td data-label="Tipo de actividad">{getCategoryLabel(audit.category)}</td>
                      <td data-label="Qué pasó">{audit.summary}</td>
                      <td data-label="Registro afectado">{getTargetLabel(audit)}</td>
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
                        <td colSpan={6}>
                          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                            <div>
                              <strong>Descripción técnica</strong>
                              <pre>{`${audit.action} | ${audit.method} | ${audit.path}`}</pre>
                            </div>
                            <div>
                              <strong>Detalle completo</strong>
                              <pre>{JSON.stringify(audit.metadata, null, 2)}</pre>
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