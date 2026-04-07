import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../state/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

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

  const getGradeColor = (grade) => {
    const g = parseFloat(grade)
    if (g >= 4.5) return 'var(--success)'
    if (g >= 3.0) return 'var(--warning)'
    return 'var(--danger)'
  }

  const officialStatusMeta = {
    DRAFT: { label: 'Borrador', color: 'var(--text-muted)' },
    APPROVED: { label: 'Aprobado', color: 'var(--warning)' },
    ISSUED: { label: 'Emitido', color: 'var(--success)' },
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
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--danger)' }}>
          <p style={{ fontSize: '2rem', margin: 0 }}>⚠️</p>
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
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>📋</p>
          <h2 style={{ margin: '1rem 0', color: 'var(--text-primary)' }}>
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
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', color: 'var(--text-primary)' }}>
              📋 Mis Boletines
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
              Historial de notas por periodo académico
            </p>
          </div>

          {availableYears.length > 1 && (
            <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
              <label htmlFor="year-filter" style={{ fontSize: 'var(--font-size-sm)' }}>
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
        <div className="notice danger" style={{ marginBottom: 'var(--space-lg)' }}>
          {error}
        </div>
      )}

      {/* Bulletins grouped by year */}
      {groupedBulletins.map(([year, yearBulletins]) => (
        <div key={year} style={{ marginBottom: 'var(--space-xl)' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
          >
            📅 Año {year}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {yearBulletins.map((bulletin) => (
              <div key={bulletin.id}>
                {(() => {
                  const status = officialStatusMeta[bulletin.official_status] || officialStatusMeta.DRAFT
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        marginBottom: 'var(--space-xs)',
                        fontSize: 'var(--font-size-xs)',
                        color: status.color,
                        fontWeight: 700,
                      }}
                    >
                      {status.label}
                    </span>
                  )
                })()}
                {/* Period card */}
                <button
                  type="button"
                  className="card card-button"
                  aria-label={`Ver boletín ${bulletin.period_label}`}
                  aria-expanded={expandedBulletinId === bulletin.id}
                  onClick={() => loadBulletinDetail(bulletin.id)}
                  onKeyDown={(e) => handleKeyDownCard(e, bulletin.id)}
                  style={{
                    margin: 0,
                    border:
                      expandedBulletinId === bulletin.id
                        ? '2px solid var(--primary)'
                        : '2px solid transparent',
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span>
                      <span style={{ display: 'block', margin: 0, color: 'var(--text-primary)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
                        Periodo {bulletin.period_number}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          margin: '0.25rem 0 0 0',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {new Date(bulletin.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 'var(--font-size-2xl)',
                          fontWeight: 700,
                          color: getGradeColor(bulletin.average_grade),
                        }}
                      >
                        {bulletin.average_grade?.toFixed(2) ?? '—'}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Promedio
                      </span>
                    </span>
                  </span>

                  <span
                    style={{
                      display: 'flex',
                      marginTop: 'var(--space-sm)',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {bulletin.total_subjects}{' '}
                      {bulletin.total_subjects === 1 ? 'materia' : 'materias'}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      {expandedBulletinId === bulletin.id ? '▲ Ocultar' : '▼ Ver detalle'}
                    </span>
                  </span>
                </button>

                {/* Expanded detail */}
                {expandedBulletinId === bulletin.id && (
                  <div
                    className="card fade-in"
                    style={{
                      marginTop: 'var(--space-sm)',
                      borderLeft: '4px solid var(--primary)',
                    }}
                  >
                    {loadingDetail ? (
                      <div className="loading">
                        <div className="spinner"></div>
                        <span>Cargando detalle...</span>
                      </div>
                    ) : bulletinDetail ? (
                      <>
                        <h4
                          style={{
                            margin: '0 0 var(--space-md) 0',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Detalle — {bulletinDetail.period_label}
                        </h4>

                        {bulletinDetail.official_comment && (
                          <div className="notice" style={{ marginBottom: 'var(--space-sm)' }}>
                            <strong>Comentario oficial:</strong> {bulletinDetail.official_comment}
                          </div>
                        )}

                        {bulletin.financial_hold_active && bulletin.financial_hold_message && (
                          <div className="notice danger" role="alert" style={{ marginBottom: 'var(--space-sm)' }}>
                            {bulletin.financial_hold_message}
                          </div>
                        )}

                        {bulletin.can_download_official_pdf && bulletin.official_status === 'ISSUED' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-sm)' }}>
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
                                <th style={{ textAlign: 'center' }}>Nota</th>
                                <th style={{ textAlign: 'center' }}>Promedio ejercicios</th>
                                <th style={{ textAlign: 'center' }}>Calificados</th>
                                <th style={{ textAlign: 'center' }}>Entregados</th>
                                <th style={{ textAlign: 'center' }}>Faltas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulletinDetail.entries.map((entry) => (
                                <tr key={entry.id}>
                                  <td data-label="Materia">{entry.subject_name}</td>
                                  <td
                                    data-label="Nota"
                                    style={{
                                      textAlign: 'center',
                                      fontWeight: 700,
                                      fontSize: 'var(--font-size-lg)',
                                      color: getGradeColor(entry.grade),
                                    }}
                                  >
                                    {parseFloat(entry.grade).toFixed(2)}
                                  </td>
                                  <td data-label="Promedio" style={{ textAlign: 'center' }}>
                                    <StatusBadge status={null} grade={parseFloat(entry.average_score)} />
                                  </td>
                                  <td data-label="Calificados" style={{ textAlign: 'center', color: 'var(--success)' }}>
                                    {entry.graded_count}
                                  </td>
                                  <td data-label="Entregados" style={{ textAlign: 'center', color: 'var(--warning)' }}>
                                    {entry.submitted_count}
                                  </td>
                                  <td data-label="Faltas" style={{ textAlign: 'center' }}>
                                    {entry.absence_count > 0 ? (
                                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                        {entry.absence_count}
                                        {entry.unjustified_absence_count > 0 && (
                                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block' }}>
                                            ({entry.unjustified_absence_count} inj.)
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)' }}>0</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Observations section */}
                        {bulletinDetail.entries.some((e) => e.observations_summary) && (
                          <div style={{ marginTop: 'var(--space-lg)' }}>
                            <h4
                              style={{
                                margin: '0 0 var(--space-md) 0',
                                color: 'var(--text-primary)',
                              }}
                            >
                              📝 Observaciones
                            </h4>
                            {bulletinDetail.entries
                              .filter((e) => e.observations_summary)
                              .map((entry) => (
                                <div
                                  key={`obs-${entry.id}`}
                                  style={{
                                    marginBottom: 'var(--space-md)',
                                    padding: 'var(--space-md)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${getGradeColor(entry.grade)}`,
                                  }}
                                >
                                  <strong style={{ color: 'var(--text-primary)' }}>
                                    {entry.subject_name}
                                  </strong>
                                  <pre
                                    style={{
                                      margin: '0.5rem 0 0 0',
                                      whiteSpace: 'pre-wrap',
                                      fontFamily: 'inherit',
                                      fontSize: 'var(--font-size-sm)',
                                      color: 'var(--text-secondary)',
                                    }}
                                  >
                                    {entry.observations_summary}
                                  </pre>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Summary stats */}
                        <div
                          className="stats-grid"
                          style={{
                            marginTop: 'var(--space-lg)',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                          }}
                        >
                          <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>
                              {bulletinDetail.entries.length}
                            </div>
                            <div className="stat-label">Materias</div>
                          </div>
                          <div className="stat-card">
                            <div
                              className="stat-value"
                              style={{
                                color: getGradeColor(bulletinDetail.average_grade),
                              }}
                            >
                              {bulletinDetail.average_grade?.toFixed(2) ?? '—'}
                            </div>
                            <div className="stat-label">Promedio</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                              {bulletinDetail.entries.reduce((acc, e) => acc + (e.graded_count || 0), 0)}
                            </div>
                            <div className="stat-label">Calificados</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--danger)' }}>
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
