import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../state/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import './MyBulletins.css'

export default function MyBulletins() {
  const [bulletins, setBulletins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedYear, setSelectedYear] = useState('ALL')
  const [expandedBulletinId, setExpandedBulletinId] = useState(null)
  const [bulletinDetail, setBulletinDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const loadBulletins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/v1/courses/my-bulletins/')
      setBulletins(data.bulletins || [])
    } catch (err) {
      console.error('Error loading bulletins:', err)

      if (err.response?.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' },
        })
        return
      }

      if (err.message === 'Network Error') {
        setError('No se pudieron cargar tus boletines porque no hay conexion con el servidor. Revisa tu internet e intentalo de nuevo.')
        return
      }

      setError(getApiErrorMessage(err, {
        action: 'cargar tus boletines',
        fallback: 'No se pudieron cargar tus boletines. Verifica tu institucion activa e intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    loadBulletins()
  }, [loadBulletins])

  const loadBulletinDetail = async (bulletinId) => {
    if (expandedBulletinId === bulletinId) {
      setExpandedBulletinId(null)
      setBulletinDetail(null)
      return
    }

    setLoadingDetail(true)
    setExpandedBulletinId(bulletinId)
    try {
      const { data } = await api.get(`/api/v1/courses/my-bulletins/${bulletinId}/`)
      setBulletinDetail(data)
    } catch (err) {
      console.error('Error loading bulletin detail:', err)

      if (err.response?.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Tu sesión expiró. Inicia sesión nuevamente.' },
        })
        return
      }

      if (err.message === 'Network Error') {
        setError('No se pudo cargar el detalle del boletin porque no hay conexion con el servidor. Revisa tu internet e intentalo de nuevo.')
      } else {
        setError(getApiErrorMessage(err, {
          action: 'cargar el detalle del boletin',
          fallback: 'No se pudo cargar el detalle del boletin. Es posible que no tengas acceso a ese registro.',
        }))
      }
      setExpandedBulletinId(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Extract unique years for the filter
  const availableYears = useMemo(() => {
    const years = [...new Set(bulletins.map((b) => b.year))].sort((a, b) => b - a)
    return years
  }, [bulletins])

  // Group bulletins by year
  const groupedBulletins = useMemo(() => {
    let filtered = bulletins
    if (selectedYear !== 'ALL') {
      filtered = bulletins.filter((b) => b.year === Number(selectedYear))
    }

    const groups = {}
    filtered.forEach((b) => {
      if (!groups[b.year]) {
        groups[b.year] = []
      }
      groups[b.year].push(b)
    })

    // Sort periods within each year
    Object.keys(groups).forEach((year) => {
      groups[year].sort((a, b) => a.period_number - b.period_number)
    })

    // Return sorted by year descending
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a))
  }, [bulletins, selectedYear])

  const handleKeyDownCard = (event, bulletinId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      loadBulletinDetail(bulletinId)
    }
  }

  const getGradeTone = (grade) => {
    const g = parseFloat(grade)
    if (g >= 4.5) return 'my-bulletins__tone--success'
    if (g >= 3.0) return 'my-bulletins__tone--warning'
    return 'my-bulletins__tone--danger'
  }

  const officialStatusMeta = {
    DRAFT: { label: 'Borrador', tone: 'my-bulletins__tone--muted' },
    APPROVED: { label: 'Aprobado', tone: 'my-bulletins__tone--warning' },
    ISSUED: { label: 'Emitido', tone: 'my-bulletins__tone--success' },
  }

  const downloadOfficialPdf = async (bulletinId) => {
    setDownloadLoading(true)
    try {
      await api.get(`/api/v1/courses/my-bulletins/${bulletinId}/official-pdf/`, {
        responseType: 'blob',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'descargar el boletín oficial',
        fallback: 'No se pudo descargar el boletín oficial.',
      }))
    } finally {
      setDownloadLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <span>Cargando boletines...</span>
        </div>
      </div>
    )
  }

  if (error && bulletins.length === 0) {
    return (
      <div className="card">
        <div className="my-bulletins__state my-bulletins__state--error">
          <p className="my-bulletins__state-icon">⚠️</p>
          <p>{error}</p>
          <button className="btn primary" onClick={loadBulletins}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (bulletins.length === 0) {
    return (
      <div className="card">
        <div className="my-bulletins__state my-bulletins__state--empty">
          <p className="my-bulletins__state-icon my-bulletins__state-icon--large">📋</p>
          <h2 className="my-bulletins__state-title">
            No tienes boletines disponibles
          </h2>
          <p>Los boletines se generan cuando el administrador cierra un periodo académico.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card my-bulletins__card-gap">
        <div className="my-bulletins__header-row">
          <div>
            <h1 className="my-bulletins__title">
              📋 Mis Boletines
            </h1>
            <p className="my-bulletins__subtitle">
              Historial de notas por periodo académico
            </p>
          </div>

          {availableYears.length > 1 && (
            <div className="form-group my-bulletins__year-filter">
              <label htmlFor="year-filter" className="my-bulletins__year-label">
                Filtrar por año
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Filtrar boletines por año"
              >
                <option value="ALL">Todos los años</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="notice danger my-bulletins__card-gap">
          {error}
        </div>
      )}

      {/* Bulletins grouped by year */}
      {groupedBulletins.map(([year, yearBulletins]) => (
        <div key={year} className="my-bulletins__year-block">
          <h2 className="my-bulletins__year-title">
            📅 Año {year}
          </h2>

          <div className="my-bulletins__year-grid">
            {yearBulletins.map((bulletin) => (
              <div key={bulletin.id}>
                {(() => {
                  const status = officialStatusMeta[bulletin.official_status] || officialStatusMeta.DRAFT
                  return (
                    <span className={`my-bulletins__status-chip ${status.tone}`}>
                      {status.label}
                    </span>
                  )
                })()}
                {/* Period card */}
                <button
                  type="button"
                  aria-label={`Ver boletín ${bulletin.period_label}`}
                  aria-expanded={expandedBulletinId === bulletin.id}
                  onClick={() => loadBulletinDetail(bulletin.id)}
                  onKeyDown={(e) => handleKeyDownCard(e, bulletin.id)}
                  className={`card card-button my-bulletins__period-card ${expandedBulletinId === bulletin.id ? 'my-bulletins__period-card--active' : ''}`}
                >
                  <span className="my-bulletins__period-head">
                    <span>
                      <span className="my-bulletins__period-name">
                        Periodo {bulletin.period_number}
                      </span>
                      <span className="my-bulletins__period-date">
                        {new Date(bulletin.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                    <span className="my-bulletins__period-grade-wrap">
                      <span className={`my-bulletins__period-grade ${getGradeTone(bulletin.average_grade)}`}>
                        {bulletin.average_grade?.toFixed(2) ?? '—'}
                      </span>
                      <span className="my-bulletins__period-grade-label">
                        Promedio
                      </span>
                    </span>
                  </span>

                  <span className="my-bulletins__period-footer">
                    <span className="my-bulletins__period-subjects">
                      {bulletin.total_subjects}{' '}
                      {bulletin.total_subjects === 1 ? 'materia' : 'materias'}
                    </span>
                    <span className="my-bulletins__period-toggle">
                      {expandedBulletinId === bulletin.id ? '▲ Ocultar' : '▼ Ver detalle'}
                    </span>
                  </span>
                </button>

                {/* Expanded detail */}
                {expandedBulletinId === bulletin.id && (
                  <div className="card fade-in my-bulletins__detail-card">
                    {loadingDetail ? (
                      <div className="loading">
                        <div className="spinner"></div>
                        <span>Cargando detalle...</span>
                      </div>
                    ) : bulletinDetail ? (
                      <>
                        <h4 className="my-bulletins__detail-title">
                          Detalle — {bulletinDetail.period_label}
                        </h4>

                        {bulletinDetail.official_comment && (
                          <div className="notice my-bulletins__notice-bottom-sm">
                            <strong>Comentario oficial:</strong> {bulletinDetail.official_comment}
                          </div>
                        )}

                        {bulletin.financial_hold_active && bulletin.financial_hold_message && (
                          <div className="notice danger my-bulletins__notice-bottom-sm" role="alert">
                            {bulletin.financial_hold_message}
                          </div>
                        )}

                        {bulletin.can_download_official_pdf && bulletin.official_status === 'ISSUED' && (
                          <div className="my-bulletins__download-row">
                            <button
                              type="button"
                              className="btn secondary"
                              onClick={() => downloadOfficialPdf(bulletin.id)}
                              disabled={downloadLoading}
                              aria-label="Descargar PDF oficial"
                            >
                              Descargar PDF oficial
                            </button>
                          </div>
                        )}

                        <div className="table-container">
                          <table className="table mobile-card-view">
                            <thead>
                              <tr>
                                <th>Materia</th>
                                <th className="my-bulletins__text-center">Nota</th>
                                <th className="my-bulletins__text-center">Promedio ejercicios</th>
                                <th className="my-bulletins__text-center">Calificados</th>
                                <th className="my-bulletins__text-center">Entregados</th>
                                <th className="my-bulletins__text-center">Faltas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulletinDetail.entries.map((entry) => (
                                <tr key={entry.id}>
                                  <td data-label="Materia">{entry.subject_name}</td>
                                  <td data-label="Nota" className={`my-bulletins__grade-cell ${getGradeTone(entry.grade)}`}>
                                    {parseFloat(entry.grade).toFixed(2)}
                                  </td>
                                  <td data-label="Promedio" className="my-bulletins__text-center">
                                    <StatusBadge status={null} grade={parseFloat(entry.average_score)} />
                                  </td>
                                  <td data-label="Calificados" className="my-bulletins__text-center my-bulletins__tone--success">
                                    {entry.graded_count}
                                  </td>
                                  <td data-label="Entregados" className="my-bulletins__text-center my-bulletins__tone--warning">
                                    {entry.submitted_count}
                                  </td>
                                  <td data-label="Faltas" className="my-bulletins__text-center">
                                    {entry.absence_count > 0 ? (
                                      <span className="my-bulletins__tone--danger my-bulletins__absences">
                                        {entry.absence_count}
                                        {entry.unjustified_absence_count > 0 && (
                                          <span className="my-bulletins__inj">
                                            ({entry.unjustified_absence_count} inj.)
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="my-bulletins__muted">0</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Observations section */}
                        {bulletinDetail.entries.some((e) => e.observations_summary) && (
                          <div className="my-bulletins__observations">
                            <h4 className="my-bulletins__detail-title">
                              📝 Observaciones
                            </h4>
                            {bulletinDetail.entries
                              .filter((e) => e.observations_summary)
                              .map((entry) => (
                                <div
                                  key={`obs-${entry.id}`}
                                  className={`my-bulletins__observation-item ${getGradeTone(entry.grade)}`}
                                >
                                  <strong className="my-bulletins__observation-subject">
                                    {entry.subject_name}
                                  </strong>
                                  <pre className="my-bulletins__observation-text">
                                    {entry.observations_summary}
                                  </pre>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Summary stats */}
                        <div className="stats-grid my-bulletins__stats-grid">
                          <div className="stat-card">
                            <div className="stat-value my-bulletins__tone--primary">
                              {bulletinDetail.entries.length}
                            </div>
                            <div className="stat-label">Materias</div>
                          </div>
                          <div className="stat-card">
                            <div className={`stat-value ${getGradeTone(bulletinDetail.average_grade)}`}>
                              {bulletinDetail.average_grade?.toFixed(2) ?? '—'}
                            </div>
                            <div className="stat-label">Promedio</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value my-bulletins__tone--success">
                              {bulletinDetail.entries.reduce((acc, e) => acc + (e.graded_count || 0), 0)}
                            </div>
                            <div className="stat-label">Calificados</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value my-bulletins__tone--danger">
                              {bulletinDetail.entries.reduce((acc, e) => acc + (e.submitted_count || 0), 0)}
                            </div>
                            <div className="stat-label">Entregados</div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
