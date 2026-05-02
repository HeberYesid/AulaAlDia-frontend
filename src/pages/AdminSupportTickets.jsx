import { useEffect, useMemo, useState } from 'react'
import Alert from '../components/Alert'
import { useSupportTickets } from '../hooks/useSupportTickets'

const DEFAULT_FILTERS = {
  status: 'ALL',
  search: '',
}

const STATUS_LABELS = {
  OPEN: 'Abierto',
  IN_REVIEW: 'En revision',
  RESOLVED: 'Resuelto',
}

function formatTicketDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getStatusClassName(status) {
  const normalized = String(status || '').toLowerCase()
  return `support-ticket-status support-ticket-status--${normalized}`
}

function buildMessagePreview(message) {
  const value = String(message || '').trim()
  if (value.length <= 130) return value || '-'
  return `${value.slice(0, 130)}...`
}

export default function AdminSupportTickets() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const {
    tickets,
    loading,
    creating,
    error,
    success,
    form,
    openTicketsCount,
    setForm,
    loadTickets,
    createTicket,
  } = useSupportTickets()

  const hasActiveFilters = useMemo(
    () => Boolean(filters.search.trim()) || filters.status !== 'ALL',
    [filters]
  )

  useEffect(() => {
    loadTickets(filters)
  }, [filters, loadTickets])

  function handleFilterChange(key) {
    return (event) => {
      const { value } = event.target
      setFilters((current) => ({ ...current, [key]: value }))
    }
  }

  function handleResetFilters() {
    setFilters({ ...DEFAULT_FILTERS })
  }

  async function handleCreate(event) {
    event.preventDefault()
    const wasCreated = await createTicket()
    if (wasCreated && hasActiveFilters) {
      await loadTickets(filters)
    }
  }

  return (
    <div className="support-tickets">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <section className="card support-tickets__hero">
        <p className="eyebrow">Atencion al cliente</p>
        <h1>Tickets de soporte institucional</h1>
        <p>
          Crea solicitudes para contactar al desarrollador y consulta el estado de cada requerimiento.
        </p>
        <p className="support-tickets__count">Tickets abiertos visibles: {openTicketsCount} de {tickets.length}</p>
      </section>

      <section className="card">
        <h2>Crear ticket</h2>
        <form className="support-tickets__form" onSubmit={handleCreate}>
          <div className="support-tickets__grid">
            <div>
              <label htmlFor="support-ticket-subject">Asunto</label>
              <input
                id="support-ticket-subject"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                maxLength={180}
                placeholder="Ej: Error al cerrar periodo"
                required
              />
              <small className="char-counter">{form.subject.length}/180 caracteres</small>
            </div>

            <div className="support-tickets__message-field">
              <label htmlFor="support-ticket-message">Detalle del requerimiento</label>
              <textarea
                id="support-ticket-message"
                className="support-tickets__textarea"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                maxLength={4000}
                rows="5"
                placeholder="Describe el contexto, pasos para reproducir y el impacto en la institucion."
                required
              />
              <small className="char-counter">{form.message.length}/4000 caracteres</small>
            </div>
          </div>

          <button className="btn support-tickets__submit" type="submit" disabled={creating}>
            {creating ? 'Creando ticket...' : 'Crear ticket'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="support-tickets__list-header">
          <div>
            <h2>Historial institucional</h2>
            <p className="support-tickets__list-subtitle">
              Todos los administradores del colegio comparten esta bandeja de tickets.
            </p>
          </div>

          <div className="support-tickets__filters" aria-label="Filtros de tickets de soporte">
            <div className="support-tickets__filter-field">
              <label htmlFor="support-ticket-search">Buscar ticket</label>
              <input
                id="support-ticket-search"
                type="search"
                value={filters.search}
                onChange={handleFilterChange('search')}
                placeholder="Asunto, detalle o correo"
              />
            </div>

            <div className="support-tickets__filter-field">
              <label htmlFor="support-ticket-status">Filtrar por estado</label>
              <select
                id="support-ticket-status"
                value={filters.status}
                onChange={handleFilterChange('status')}
              >
                <option value="ALL">Todos</option>
                <option value="OPEN">Abiertos</option>
                <option value="IN_REVIEW">En revision</option>
                <option value="RESOLVED">Resueltos</option>
              </select>
            </div>

            <div className="support-tickets__filter-field support-tickets__filter-actions">
              <button
                className="btn secondary"
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters || loading}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table mobile-card-view">
            <thead>
              <tr>
                <th>Asunto</th>
                <th>Detalle</th>
                <th>Creado por</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Resuelto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="6">Cargando tickets de soporte...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="6">
                    {hasActiveFilters
                      ? 'No hay tickets que coincidan con los filtros actuales.'
                      : 'Aun no se han registrado tickets de soporte para esta institucion.'}
                  </td>
                </tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td data-label="Asunto">
                    <div className="support-tickets__subject-cell">
                      <strong>{ticket.subject}</strong>
                      <span className="support-tickets__ticket-id">#{ticket.id}</span>
                    </div>
                  </td>
                  <td data-label="Detalle" className="support-tickets__message-preview">
                    {buildMessagePreview(ticket.message)}
                  </td>
                  <td data-label="Creado por">{ticket.created_by_name || ticket.created_by_email || '-'}</td>
                  <td data-label="Estado">
                    <span className={getStatusClassName(ticket.status)}>
                      {ticket.status_label || STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </td>
                  <td data-label="Creado">{formatTicketDate(ticket.created_at)}</td>
                  <td data-label="Resuelto">{formatTicketDate(ticket.resolved_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
