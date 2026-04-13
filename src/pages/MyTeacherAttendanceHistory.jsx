import { useEffect, useMemo, useState } from 'react'

import { listMyTeacherAttendanceHistory } from '../hooks/useTeacherAttendance'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const INITIAL_FILTERS = {
  date_from: '',
  date_to: '',
  status: '',
  order: 'desc',
}

function buildQueryParams(filters) {
  return Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {})
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function MyTeacherAttendanceHistory() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [logs, setLogs] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadLogs(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const data = await listMyTeacherAttendanceHistory(buildQueryParams(nextFilters))
      setLogs(Array.isArray(data) ? data : [])
      setSelectedLog((prev) => {
        if (!prev) return null
        return (Array.isArray(data) ? data : []).find((log) => log.id === prev.id) || null
      })
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          action: 'cargar tu historial de asistencia docente',
          fallback: 'No se pudo cargar tu historial de asistencia docente. Verificá los filtros y reintentá.',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusLabel = useMemo(
    () => ({
      open: 'Abierto',
      closed: 'Cerrado',
    }),
    []
  )

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await loadLogs(filters)
  }

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS)
    await loadLogs(INITIAL_FILTERS)
  }

  return (
    <section className="fade-in" style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <div className="card">
        <h1 style={{ marginBottom: 'var(--space-sm)' }}>Mi Historial de Asistencia</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Revisá tus entradas y salidas registradas por día laborable.
        </p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="grid cols-4">
          <div className="form-group">
            <label htmlFor="my-attendance-date-from">Desde</label>
            <input
              id="my-attendance-date-from"
              type="date"
              value={filters.date_from}
              onChange={(event) => handleFilterChange('date_from', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="my-attendance-date-to">Hasta</label>
            <input
              id="my-attendance-date-to"
              type="date"
              value={filters.date_to}
              onChange={(event) => handleFilterChange('date_to', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="my-attendance-status">Estado</label>
            <select
              id="my-attendance-status"
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              <option value="">Todos</option>
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="my-attendance-order">Orden</label>
            <select
              id="my-attendance-order"
              value={filters.order}
              onChange={(event) => handleFilterChange('order', event.target.value)}
            >
              <option value="desc">Más recientes</option>
              <option value="asc">Más antiguos</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={handleClear}>
            Limpiar
          </button>
          <button type="submit" className="btn primary">
            Filtrar
          </button>
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid cols-2">
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Registros</h2>
          {loading ? (
            <div className="loading">
              <div className="spinner" role="status" aria-label="Cargando historial de asistencia docente"></div>
              <span aria-hidden="true">Cargando historial…</span>
            </div>
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No tenés registros de asistencia docente todavía.</p>
          ) : (
            <div className="data-table">
              <table className="table mobile-card-view">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td data-label="Fecha">{log.working_date}</td>
                      <td data-label="Estado">{statusLabel[log.status] || log.status}</td>
                      <td data-label="Detalle">
                        <button className="btn secondary" type="button" onClick={() => setSelectedLog(log)}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Detalle</h2>
          {!selectedLog ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Seleccioná un registro para ver su detalle.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              <p>
                <strong>Fecha laboral:</strong> {selectedLog.working_date}
              </p>
              <p>
                <strong>Entrada:</strong> {formatDateTime(selectedLog.check_in_at)}
              </p>
              <p>
                <strong>Salida:</strong> {formatDateTime(selectedLog.check_out_at)}
              </p>
              <p>
                <strong>Estado:</strong> {statusLabel[selectedLog.status] || selectedLog.status}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
