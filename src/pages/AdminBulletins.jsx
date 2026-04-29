import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../state/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import './AdminBulletins.css'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formatDate(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminBulletins() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [bulletins, setBulletins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('ALL')
  const [expandedBulletinId, setExpandedBulletinId] = useState(null)
  const [detailByBulletinId, setDetailByBulletinId] = useState({})
  const [detailErrorByBulletinId, setDetailErrorByBulletinId] = useState({})
  const [loadingDetailId, setLoadingDetailId] = useState(null)
  const [actionLoadingByBulletinId, setActionLoadingByBulletinId] = useState({})

  const officialStatusMeta = {
    DRAFT: { label: 'Borrador', tone: 'admin-bulletins__tone--muted' },
    APPROVED: { label: 'Aprobado', tone: 'admin-bulletins__tone--warning' },
    ISSUED: { label: 'Emitido', tone: 'admin-bulletins__tone--success' },
  }

  const getGradeToneClass = (grade) => {
    const parsed = Number.parseFloat(grade)
    if (Number.isNaN(parsed)) return 'admin-bulletins__tone--muted'
    if (parsed >= 4.5) return 'admin-bulletins__tone--success'
    if (parsed >= 3.0) return 'admin-bulletins__tone--warning'
    return 'admin-bulletins__tone--danger'
  }

  const loadBulletins = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/api/v1/courses/admin-bulletins/')
      setBulletins(Array.isArray(data?.bulletins) ? data.bulletins : [])
    } catch (err) {
      if (err.response?.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' },
        })
        return
      }

      setError(getApiErrorMessage(err, {
        action: 'cargar los boletines institucionales',
        fallback: 'No se pudieron cargar los boletines institucionales. Verifica tu institucion activa e intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    loadBulletins()
  }, [loadBulletins])

  async function loadBulletinDetail(bulletinId) {
    if (expandedBulletinId === bulletinId) {
      setExpandedBulletinId(null)
      return
    }

    setExpandedBulletinId(bulletinId)

    if (detailByBulletinId[bulletinId]) {
      return
    }

    setLoadingDetailId(bulletinId)
    setDetailErrorByBulletinId((current) => ({ ...current, [bulletinId]: '' }))

    try {
      const { data } = await api.get(`/api/v1/courses/admin-bulletins/${bulletinId}/`)
      setDetailByBulletinId((current) => ({ ...current, [bulletinId]: data }))
    } catch (err) {
      if (err.response?.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' },
        })
        return
      }

      const message = getApiErrorMessage(err, {
        action: 'cargar el detalle del boletin',
        fallback: 'No se pudo cargar el detalle del boletin. Intentalo nuevamente.',
      })
      setDetailErrorByBulletinId((current) => ({ ...current, [bulletinId]: message }))
    } finally {
      setLoadingDetailId((current) => (current === bulletinId ? null : current))
    }
  }

  function setActionLoading(bulletinId, action, value) {
    setActionLoadingByBulletinId((current) => ({
      ...current,
      [bulletinId]: {
        ...(current[bulletinId] || {}),
        [action]: value,
      },
    }))
  }

  async function approveBulletin(bulletinId) {
    setActionLoading(bulletinId, 'approve', true)
    try {
      await api.post(`/api/v1/courses/admin-bulletins/${bulletinId}/approve/`, {
        official_comment: 'Aprobado por administración',
      })
      await loadBulletins()
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'aprobar el boletín',
        fallback: 'No se pudo aprobar el boletín.',
      }))
    } finally {
      setActionLoading(bulletinId, 'approve', false)
    }
  }

  async function issueBulletin(bulletinId) {
    setActionLoading(bulletinId, 'issue', true)
    try {
      await api.post(`/api/v1/courses/admin-bulletins/${bulletinId}/issue/`)
      await loadBulletins()
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'emitir el boletín',
        fallback: 'No se pudo emitir el boletín oficial.',
      }))
    } finally {
      setActionLoading(bulletinId, 'issue', false)
    }
  }

  async function downloadOfficialPdf(bulletinId) {
    setActionLoading(bulletinId, 'download', true)
    try {
      await api.get(`/api/v1/courses/admin-bulletins/${bulletinId}/official-pdf/`, {
        responseType: 'blob',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'descargar el PDF oficial',
        fallback: 'No se pudo descargar el PDF oficial.',
      }))
    } finally {
      setActionLoading(bulletinId, 'download', false)
    }
  }

  const periodOptions = useMemo(() => {
    const values = new Set(
      bulletins
        .map((bulletin) => Number(bulletin.sequence))
        .filter((value) => Number.isFinite(value) && value > 0)
    )
    return [...values].sort((first, second) => first - second)
  }, [bulletins])

  const filteredBulletins = useMemo(() => {
    const normalizedSearch = normalizeText(search)

    return bulletins.filter((bulletin) => {
      if (periodFilter !== 'ALL' && Number(bulletin.sequence) !== Number(periodFilter)) {
        return false
      }

      if (!normalizedSearch) return true

      const studentName = normalizeText(bulletin.student_name)
      const studentEmail = normalizeText(bulletin.student_email)
      const periodLabel = normalizeText(bulletin.period_label)

      return studentName.includes(normalizedSearch)
        || studentEmail.includes(normalizedSearch)
        || periodLabel.includes(normalizedSearch)
    })
  }, [bulletins, search, periodFilter])

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <span>Cargando boletines institucionales...</span>
        </div>
      </div>
    )
  }

  if (error && bulletins.length === 0) {
    return (
      <div className="card">
        <div className="admin-bulletins__state admin-bulletins__state--error">
          <p className="admin-bulletins__state-icon">⚠️</p>
          <p>{error}</p>
          <button className="btn primary" onClick={loadBulletins}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="card admin-bulletins__card-gap">
        <div className="admin-bulletins__header-block">
          <h1 className="admin-bulletins__header-title">Boletines institucionales</h1>
          <p className="admin-bulletins__header-copy">
            Consulta boletines del año escolar activo, revisa detalle por estudiante y valida materias consolidadas por periodo.
          </p>
        </div>
      </div>

      <div className="card admin-bulletins__card-gap">
        <div className="admin-bulletins__filter-grid">
          <div className="form-group admin-bulletins__form-group-reset">
            <label htmlFor="admin-bulletins-search">Buscar estudiante o periodo</label>
            <input
              id="admin-bulletins-search"
              type="search"
              placeholder="Nombre, correo o periodo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="form-group admin-bulletins__form-group-reset">
            <label htmlFor="admin-bulletins-period">Filtrar por periodo</label>
            <select
              id="admin-bulletins-period"
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
            >
              <option value="ALL">Todos los periodos</option>
              {periodOptions.map((period) => (
                <option key={period} value={period}>
                  Periodo {period}
                </option>
              ))}
            </select>
          </div>

          <div className="stat-card admin-bulletins__stat-stretch">
            <div className="stat-value admin-bulletins__tone--primary">{filteredBulletins.length}</div>
            <div className="stat-label">Boletines visibles</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="notice danger admin-bulletins__card-gap">
          {error}
        </div>
      )}

      <section className="card">
        {filteredBulletins.length === 0 ? (
          <div className="admin-bulletins__state admin-bulletins__state--empty">
            <p className="admin-bulletins__state-icon admin-bulletins__state-icon--empty">📋</p>
            <h2 className="admin-bulletins__state-title">
              No hay boletines para los filtros actuales
            </h2>
            <p className="admin-bulletins__state-copy">
              Prueba con otro criterio de búsqueda o verifica si ya se cerraron periodos académicos.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Correo</th>
                  <th className="admin-bulletins__text-center">Periodo</th>
                  <th className="admin-bulletins__text-center">Promedio</th>
                  <th className="admin-bulletins__text-center">Materias</th>
                  <th className="admin-bulletins__text-center">Estado oficial</th>
                  <th>Generado</th>
                  <th className="admin-bulletins__text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredBulletins.map((bulletin) => {
                  const isExpanded = expandedBulletinId === bulletin.id
                  const detail = detailByBulletinId[bulletin.id]
                  const detailError = detailErrorByBulletinId[bulletin.id]
                  const isLoadingDetail = loadingDetailId === bulletin.id
                  const actionLoading = actionLoadingByBulletinId[bulletin.id] || {}
                  const statusMeta = officialStatusMeta[bulletin.official_status] || officialStatusMeta.DRAFT

                  return [
                    <tr key={`bulletin-${bulletin.id}`}>
                        <td data-label="Estudiante">{bulletin.student_name || 'Sin nombre'}</td>
                        <td data-label="Correo">{bulletin.student_email}</td>
                        <td data-label="Periodo" className="admin-bulletins__text-center">Periodo {bulletin.sequence}</td>
                        <td
                          data-label="Promedio"
                          className={`admin-bulletins__grade-cell ${getGradeToneClass(bulletin.average_grade)}`}
                        >
                          {Number.parseFloat(bulletin.average_grade || 0).toFixed(2)}
                        </td>
                        <td data-label="Materias" className="admin-bulletins__text-center">{bulletin.total_subjects}</td>
                        <td
                          data-label="Estado oficial"
                          className={`admin-bulletins__status-cell ${statusMeta.tone}`}
                        >
                          {statusMeta.label}
                        </td>
                        <td data-label="Generado">{formatDate(bulletin.created_at)}</td>
                        <td data-label="Acción" className="admin-bulletins__text-right">
                          <div className="admin-bulletins__action-group">
                            {bulletin.official_status === 'DRAFT' && (
                              <button
                                type="button"
                                className="btn warning"
                                disabled={actionLoading.approve}
                                onClick={() => approveBulletin(bulletin.id)}
                                aria-label="Aprobar boletín"
                              >
                                Aprobar
                              </button>
                            )}
                            {bulletin.official_status === 'APPROVED' && (
                              <button
                                type="button"
                                className="btn primary"
                                disabled={actionLoading.issue}
                                onClick={() => issueBulletin(bulletin.id)}
                                aria-label="Emitir boletín"
                              >
                                Emitir
                              </button>
                            )}
                            {bulletin.official_status === 'ISSUED' && (
                              <button
                                type="button"
                                className="btn secondary"
                                disabled={actionLoading.download}
                                onClick={() => downloadOfficialPdf(bulletin.id)}
                                aria-label="Descargar PDF oficial"
                              >
                                PDF oficial
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn secondary"
                              onClick={() => loadBulletinDetail(bulletin.id)}
                              aria-expanded={isExpanded}
                              aria-label={`Ver detalle de ${bulletin.student_email}`}
                            >
                              {isExpanded ? 'Ocultar' : 'Ver detalle'}
                            </button>
                          </div>
                        </td>
                      </tr>,
                    isExpanded ? (
                        <tr key={`detail-${bulletin.id}`}>
                          <td colSpan={8} data-label="Detalle" className="admin-bulletins__detail-cell">
                            <div className="card admin-bulletins__detail-card">
                              {isLoadingDetail ? (
                                <div className="loading">
                                  <div className="spinner"></div>
                                  <span>Cargando detalle...</span>
                                </div>
                              ) : detailError ? (
                                <div className="notice danger">{detailError}</div>
                              ) : detail ? (
                                <div className="admin-bulletins__detail-stack">
                                  <h3 className="admin-bulletins__detail-title">
                                    Detalle de {detail.student_name || detail.student_email} — {detail.period_label}
                                  </h3>
                                  {!!detail.official_comment && (
                                    <div className="notice admin-bulletins__pre-wrap">
                                      <strong>Comentario oficial:</strong> {detail.official_comment}
                                    </div>
                                  )}

                                  <div className="table-container">
                                    <table className="table mobile-card-view">
                                      <thead>
                                        <tr>
                                          <th>Materia</th>
                                          <th className="admin-bulletins__text-center">Nota</th>
                                          <th className="admin-bulletins__text-center">Promedio</th>
                                          <th className="admin-bulletins__text-center">Calificados</th>
                                          <th className="admin-bulletins__text-center">Entregados</th>
                                          <th className="admin-bulletins__text-center">Faltas</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detail.entries.map((entry) => (
                                          <tr key={entry.id}>
                                            <td data-label="Materia">{entry.subject_name}</td>
                                            <td
                                              data-label="Nota"
                                              className={`admin-bulletins__grade-cell ${getGradeToneClass(entry.grade)}`}
                                            >
                                              {Number.parseFloat(entry.grade || 0).toFixed(2)}
                                            </td>
                                            <td data-label="Promedio" className="admin-bulletins__text-center">
                                              <StatusBadge status={null} grade={Number.parseFloat(entry.average_score || 0)} />
                                            </td>
                                            <td data-label="Calificados" className="admin-bulletins__text-center">{entry.graded_count}</td>
                                            <td data-label="Entregados" className="admin-bulletins__text-center">{entry.submitted_count}</td>
                                            <td data-label="Faltas" className="admin-bulletins__text-center">
                                              {entry.absence_count}
                                              {entry.unjustified_absence_count > 0 ? ` (${entry.unjustified_absence_count} inj.)` : ''}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {detail.entries.some((entry) => entry.observations_summary) && (
                                    <div className="admin-bulletins__detail-stack-sm">
                                      <h4 className="admin-bulletins__detail-subtitle">Observaciones</h4>
                                      {detail.entries
                                        .filter((entry) => entry.observations_summary)
                                        .map((entry) => (
                                          <div
                                            key={`obs-${entry.id}`}
                                            className={`admin-bulletins__observation-item ${getGradeToneClass(entry.grade)}`}
                                          >
                                            <strong>{entry.subject_name}</strong>
                                            <p className="admin-bulletins__observation-copy">
                                              {entry.observations_summary}
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null,
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
