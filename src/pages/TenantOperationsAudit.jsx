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

const METHOD_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
]

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
  const [audits, setAudits] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [auditLimit, setAuditLimit] = useState(20)
  const [auditActorEmail, setAuditActorEmail] = useState('')
  const [auditCategory, setAuditCategory] = useState('')
  const [auditMethod, setAuditMethod] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditOrder, setAuditOrder] = useState('desc')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [auditOffset, setAuditOffset] = useState(0)
  const [auditTotalCount, setAuditTotalCount] = useState(0)
  const [expandedAuditId, setExpandedAuditId] = useState(null)

  const isTenantAdmin = user?.role === 'ADMIN'

  async function loadAudits({ offset = auditOffset, clearError = true } = {}) {
    if (!activeTenantId) {
      setError('No hay un tenant activo seleccionado.')
      return
    }

    setLoading(true)
    if (clearError) {
      setError('')
    }

    try {
      const { data } = await api.get('/api/v1/auth/tenant-operation-audits/', {
        params: {
          limit: auditLimit,
          offset,
          actor_email: auditActorEmail || undefined,
          category: auditCategory || undefined,
          method: auditMethod || undefined,
          action: auditAction || undefined,
          search: auditSearch || undefined,
          order: auditOrder,
          date_from: auditDateFrom || undefined,
          date_to: auditDateTo || undefined,
        },
      })
      setAudits(Array.isArray(data?.results) ? data.results : [])
      setAuditOffset(data?.offset || 0)
      setAuditTotalCount(data?.total_count || 0)
      setExpandedAuditId(null)
    } catch (requestError) {
      setError(normalizeApiErrors(requestError))
      setAudits([])
      setAuditTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isTenantAdmin || !activeTenantId) {
      return
    }
    loadAudits({ offset: 0, clearError: false })
  }, [activeTenantId, isTenantAdmin])

  async function applyFilters() {
    await loadAudits({ offset: 0 })
  }

  async function goToPreviousPage() {
    const previousOffset = Math.max(0, auditOffset - auditLimit)
    await loadAudits({ offset: previousOffset })
  }

  async function goToNextPage() {
    const nextOffset = auditOffset + auditLimit
    await loadAudits({ offset: nextOffset })
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
        limit: auditLimit,
        actor_email: auditActorEmail || null,
        category: auditCategory || null,
        method: auditMethod || null,
        action: auditAction || null,
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
          Visualiza operaciones mutantes exitosas ejecutadas dentro del tenant activo.
        </p>
        <p className="notice">
          Tenant activo: <strong>{activeTenantId || 'No definido'}</strong>
        </p>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Operaciones Recientes</h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              className="btn secondary"
              type="button"
              onClick={() => loadAudits({ offset: auditOffset })}
              disabled={loading || !activeTenantId}
            >
              {loading ? 'Recargando...' : 'Recargar'}
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
            <label htmlFor="operation-limit">Límite</label>
            <select
              id="operation-limit"
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
            <label htmlFor="operation-method">Método</label>
            <select
              id="operation-method"
              value={auditMethod}
              onChange={(event) => setAuditMethod(event.target.value)}
            >
              {METHOD_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="operation-action">Acción exacta</label>
            <input
              id="operation-action"
              type="text"
              value={auditAction}
              onChange={(event) => setAuditAction(event.target.value.trim().toUpperCase())}
              placeholder="ej: SUBJECT_CREATED"
            />
          </div>

          <div className="form-group">
            <label htmlFor="operation-search">Buscar en resumen o ruta</label>
            <input
              id="operation-search"
              type="text"
              value={auditSearch}
              onChange={(event) => setAuditSearch(event.target.value)}
              placeholder="ej: results-csv"
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
            disabled={loading || !activeTenantId}
          >
            Aplicar filtros
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={goToPreviousPage}
            disabled={loading || auditOffset <= 0}
          >
            Anterior
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={goToNextPage}
            disabled={loading || (auditOffset + audits.length) >= auditTotalCount}
          >
            Siguiente
          </button>
          <span className="notice" style={{ alignSelf: 'center' }}>
            Mostrando {audits.length ? auditOffset + 1 : 0}-{auditOffset + audits.length} de {auditTotalCount}
          </span>
        </div>

        {audits.length === 0 ? (
          <p className="notice" style={{ marginTop: 'var(--space-md)' }}>
            No hay operaciones registradas para el tenant activo con los filtros actuales.
          </p>
        ) : (
          <div className="table-container" style={{ marginTop: 'var(--space-md)' }}>
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Actor</th>
                  <th>Categoría</th>
                  <th>Resumen</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <Fragment key={audit.id}>
                    <tr>
                      <td data-label="Fecha">{new Date(audit.created_at).toLocaleString()}</td>
                      <td data-label="Actor">{audit.actor_email || 'Sistema'}</td>
                      <td data-label="Categoría">{audit.category}</td>
                      <td data-label="Resumen">{audit.summary}</td>
                      <td data-label="Acción">
                        <code>{`${audit.method} ${audit.action}`}</code>
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
                        <td colSpan={6}>
                          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                            <div>
                              <strong>Ruta</strong>
                              <pre>{audit.path}</pre>
                            </div>
                            <div>
                              <strong>Metadata</strong>
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