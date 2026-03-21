import React, { useEffect, useState } from 'react'
import { api } from '../api/axios'

function toDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export default function SidebarBanner() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data } = await api.get('/api/v1/courses/calendar/all_events/')
        const allEvents = Array.isArray(data) ? data : []
        
        const now = new Date()
        
        // Filtrar solo eventos futuros y tomar los 4 más próximos
        const upcomingEvents = allEvents
          .filter((event) => {
            const startValue = event.start || event.start_time || event.date
            const startDate = toDate(startValue)
            return startDate && startDate >= now
          })
          .sort((a, b) => {
            const first = toDate(a.start || a.start_time || a.date)?.getTime() || 0
            const second = toDate(b.start || b.start_time || b.date)?.getTime() || 0
            return first - second
          })
          .slice(0, 4)

        setEvents(upcomingEvents)
      } catch (err) {
        console.error('Error loading calendar events for sidebar:', err)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  return (
    <aside className="sidebar-banner fade-in">
      <div className="sidebar-banner__section">
        <h2 className="sidebar-banner__section-title">
          <span>📢</span> Anuncios Generales
        </h2>
        <div className="sidebar-banner__announcement">
          <strong>¡Bienvenidos!</strong>
          <p>Mantente al día con las últimas novedades de tu institución aquí. Revisa regularmente este espacio para comunicados importantes.</p>
        </div>
      </div>

      <div className="sidebar-banner__section">
        <h2 className="sidebar-banner__section-title">
          <span>📅</span> Próximos Eventos
        </h2>
        
        {loading ? (
          <div className="sidebar-banner__empty">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="sidebar-banner__empty">No hay eventos próximos agendados.</div>
        ) : (
          <div className="sidebar-banner__events-list">
            {events.map((event, idx) => {
              const startDate = toDate(event.start || event.start_time || event.date)
              return (
                <div key={event.id || idx} className="sidebar-banner__event">
                  <div className="sidebar-banner__event-title">
                    {event.title || 'Evento Institucional'}
                  </div>
                  <div className="sidebar-banner__event-date">
                    <span>🕒</span>
                    {startDate ? startDate.toLocaleDateString('es-CO', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Fecha por definir'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
