import { Fragment, useCallback, useEffect, useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'
import { normalizeApiErrorWithDetails } from '../api/errors'

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
  profile: 'Perfil',
  tenant: 'Institución',
  support_session: 'Sesión de soporte',
  student_tutor_invitation: 'Invitación de acudiente',
  enrollment: 'Matrícula',
}

const IMPACT_LABELS = {
  high: 'Alta prioridad',
  medium: 'Seguimiento',
  low: 'Informativo',
}

const IMPACT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'high', label: 'Alta prioridad' },
  { value: 'medium', label: 'Seguimiento' },
  { value: 'low', label: 'Informativo' },
]

const FRIENDLY_METADATA_LABELS = {
  action: 'Acción solicitada',
  reason: 'Motivo registrado',
  duration_minutes: 'Duración autorizada',
  tenant_name: 'Institución',
  tenant_slug: 'Código de la institución',
  display_name: 'Nombre visible',
  plan: 'Plan',
  max_subjects: 'Límite de materias',
  max_students: 'Límite de estudiantes',
  max_teachers: 'Límite de docentes',
  max_members: 'Límite de miembros',
  email: 'Correo',
  student_email: 'Correo del estudiante',
  student_name: 'Estudiante',
  code: 'Código',
  role: 'Rol',
  expires_at: 'Vencimiento',
}

const OMITTED_METADATA_KEYS = new Set([
  'password',
  'token',
  'access',
  'refresh',
  'submission_text',
  'query',
  'route_kwargs',
])

function normalizeAuditApiError(error) {
  return normalizeApiErrorWithDetails(error, {
    action: 'cargar la auditoria operativa',
    fallback: 'No se pudo cargar la auditoria operativa. Respuesta invalida del servidor.',
  })
}

export default function TenantOperationsAudit() {
  const { user, activeTenantId } = useAuth()
  const [allAudits, setAllAudits] = useState([])
  const [audits, setAudits] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [auditActorEmail, setAuditActorEmail] = useState('')
  const [auditCategory, setAuditCategory] = useState('')
  const [auditImpactLevel, setAuditImpactLevel] = useState('')
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

  function getImpactLevel(audit) {
    if (audit.category === 'ACCESS' || audit.category === 'CONFIGURATION') {
      return 'high'
    }

    if (audit.category === 'USER_MANAGEMENT' || String(audit.action || '').includes('DELETE')) {
      return 'medium'
    }

    return 'low'
  }

  function getImpactLabel(audit) {
    return IMPACT_LABELS[getImpactLevel(audit)] || IMPACT_LABELS.low
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

  function getStatusLabel(audit) {
    if (audit.status_code >= 200 && audit.status_code < 300) {
      return 'Se completó correctamente.'
    }

    if (audit.status_code >= 300 && audit.status_code < 400) {
      return 'Se registró con redirección o seguimiento adicional.'
    }

    return 'Se registró con observaciones y conviene revisarlo.'
  }

  function formatFriendlyValue(value) {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }

    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        return formatAuditDate(value)
      }

      const trimmedValue = value.trim()
      if (!trimmedValue) {
        return ''
      }

      if (trimmedValue.length > 120) {
        return 'Se registró contenido adicional en esta operación.'
      }

      return trimmedValue
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return ''
      }
      return `Se registraron ${value.length} elementos asociados.`
    }

    if (typeof value === 'object') {
      const objectKeys = Object.keys(value)
      if (!objectKeys.length) {
        return ''
      }
      return `Se registraron ${objectKeys.length} datos adicionales.`
    }

    return String(value)
  }

  function getFriendlyFieldLabel(key) {
    return FRIENDLY_METADATA_LABELS[key] || key.replace(/_/g, ' ')
  }

  function getFriendlyMetadataItems(audit) {
    const metadata = audit.metadata && typeof audit.metadata === 'object' ? audit.metadata : {}
    const payload = metadata.payload && typeof metadata.payload === 'object' ? metadata.payload : {}
    const query = metadata.query && typeof metadata.query === 'object' ? metadata.query : {}

    const items = []

    Object.entries(payload).forEach(([key, value]) => {
      if (OMITTED_METADATA_KEYS.has(key)) {
        if (key === 'submission_text') {
          items.push({
            label: 'Contenido enviado',
            value: 'Incluyó texto escrito en el envío.',
          })
        }
        return
      }

      const formattedValue = formatFriendlyValue(value)
      if (!formattedValue) {
        return
      }

      items.push({
        label: getFriendlyFieldLabel(key),
        value: formattedValue,
      })
    })

    if (Object.keys(query).length) {
      items.push({
        label: 'Criterios adicionales',
        value: 'La acción se realizó con filtros o parámetros complementarios.',
      })
    }

    if (!items.length && audit.target_id) {
      items.push({
        label: 'Registro relacionado',
        value: `Corresponde al identificador interno ${audit.target_id}.`,
      })
    }

    return items.slice(0, 6)
  }

  function getFriendlyDetailTitle(audit) {
    if (audit.category === 'ACCESS') {
      return 'Resumen de acceso o sesión'
    }

    if (audit.category === 'CONFIGURATION') {
      return 'Resumen de configuración'
    }

    if (audit.category === 'USER_MANAGEMENT') {
      return 'Resumen de gestión de usuarios'
    }

    return 'Resumen del movimiento'
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

    if (auditImpactLevel) {
      filteredAudits = filteredAudits.filter((audit) => getImpactLevel(audit) === auditImpactLevel)
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

  const loadAudits = useCallback(async ({ clearError = true } = {}) => {
    if (!activeTenantId) {
      setError('No hay una institución activa seleccionada.')
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
      setAudits(collectedAudits)
      setFiltersApplied(false)
      setExpandedAuditId(null)
    } catch (requestError) {
      setError(normalizeAuditApiError(requestError))
      setAllAudits([])
      setAudits([])
      setFiltersApplied(false)
    } finally {
      setLoading(false)
    }
  }, [activeTenantId])

  useEffect(() => {
    if (!isTenantAdmin || !activeTenantId) {
      return
    }
    loadAudits({ clearError: false })
  }, [activeTenantId, isTenantAdmin, loadAudits])

  async function applyFilters() {
    applyLocalFilters(allAudits)
  }

  function clearFilters() {
    setAuditActorEmail('')
    setAuditCategory('')
    setAuditImpactLevel('')
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
      institution_id: activeTenantId,
      exported_at: new Date().toISOString(),
      filters: {
        actor_email: auditActorEmail || null,
        category: auditCategory || null,
        impact_level: auditImpactLevel || null,
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
    link.download = `institution-operation-audits-${activeTenantId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!isTenantAdmin) {
    return (
      <div className="card">
        <h2>Acceso restringido</h2>
        <p>Esta sección está disponible solo para administradores de la institución.</p>
      </div>
    )
  }

  return (
    <div className="commercial-admin">
      <div className="card">
        <h2>Auditoría Operativa Institucional</h2>
        <p className="notice">
          Aquí ves una bitácora completa de actividades realizadas en toda la institución.
        </p>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>Tabla de Logs de la institución</h3>
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
          </div>
        </div>

        <div className="grid cols-2 grid-stack-mobile" style={{ marginTop: 'var(--space-md)' }}>
          <div className="form-group">
            <label htmlFor="operation-actor">Email</label>
            <input
              id="operation-actor"
              type="text"
              value={auditActorEmail}
              onChange={(event) => setAuditActorEmail(event.target.value)}
              placeholder="ej: teacher@gmail.com"
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
            <label htmlFor="operation-impact-level">Nivel</label>
            <select
              id="operation-impact-level"
              value={auditImpactLevel}
              onChange={(event) => setAuditImpactLevel(event.target.value)}
            >
              {IMPACT_OPTIONS.map((option) => (
                <option key={option.value || 'all-impact'} value={option.value}>
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
                  <th>Nivel</th>
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
                      <td data-label="Tipo de actividad">
                        <span className={`audit-log-badge audit-log-badge--category audit-log-badge--${String(audit.category || 'OTHER').toLowerCase().replace(/_/g, '-')}`}>
                          {getCategoryLabel(audit.category)}
                        </span>
                      </td>
                      <td data-label="Nivel">
                        <span className={`audit-log-badge audit-log-badge--impact audit-log-badge--${getImpactLevel(audit)}`}>
                          {getImpactLabel(audit)}
                        </span>
                      </td>
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
                          {expandedAuditId === audit.id ? 'Ocultar' : 'Ver resumen'}
                        </button>
                      </td>
                    </tr>
                    {expandedAuditId === audit.id ? (
                      <tr>
                        <td colSpan={7}>
                          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                            <div>
                              <strong>{getFriendlyDetailTitle(audit)}</strong>
                              <p className="notice" style={{ margin: '0.35rem 0 0' }}>
                                {audit.summary}. {getStatusLabel(audit)}
                              </p>
                            </div>
                            <div className="grid cols-2 grid-stack-mobile">
                              <div>
                                <strong>Información clave</strong>
                                <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.5rem' }}>
                                  <p className="notice" style={{ margin: 0 }}>
                                    <strong>Área:</strong> {getCategoryLabel(audit.category)}
                                  </p>
                                  <p className="notice" style={{ margin: 0 }}>
                                    <strong>Registro afectado:</strong> {getTargetLabel(audit)}
                                  </p>
                                  <p className="notice" style={{ margin: 0 }}>
                                    <strong>Fecha del movimiento:</strong> {formatAuditDate(audit.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <strong>Datos registrados</strong>
                                <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.5rem' }}>
                                  {getFriendlyMetadataItems(audit).length ? (
                                    getFriendlyMetadataItems(audit).map((item) => (
                                      <p key={`${audit.id}-${item.label}`} className="notice" style={{ margin: 0 }}>
                                        <strong>{item.label}:</strong> {item.value}
                                      </p>
                                    ))
                                  ) : (
                                    <p className="notice" style={{ margin: 0 }}>
                                      No hay detalles adicionales relevantes para mostrar.
                                    </p>
                                  )}
                                </div>
                              </div>
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