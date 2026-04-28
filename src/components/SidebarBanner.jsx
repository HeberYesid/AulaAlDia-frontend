import React, { useEffect, useState } from 'react'
import { api } from '../api/axios'
import { renderSafeMarkdown } from '../utils/markdown'
import { unwrapListData } from '../utils/pagination'

function toDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export default function SidebarBanner() {
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsRes, annRes] = await Promise.all([
          api.get('/api/v1/courses/calendar/all_events/'),
          api.get('/api/v1/courses/announcements/')
        ])
        
        const allEvents = unwrapListData(eventsRes.data)
        const allAnnouncements = unwrapListData(annRes.data)
        
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
        setAnnouncements(allAnnouncements.filter(a => a.is_active).slice(0, 5))
      } catch (err) {
        console.error('Error loading sidebar data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Prevenir scroll en el body cuando el panel está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <button 
        className="sidebar-banner-toggle" 
        onClick={() => setIsOpen(true)}
        aria-label="Abrir Novedades"
      >
        <span>📢</span> Novedades
      </button>

      <div 
        className={`sidebar-banner-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside 
        className={`sidebar-banner ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Panel de novedades y eventos"
      >
        <div className="sidebar-banner__header">
          <h2>Centro de Novedades</h2>
          <button 
            className="sidebar-banner__close" 
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar panel"
            title="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="sidebar-banner__section">
          <h3 className="sidebar-banner__section-title">
            <span>📣</span> Anuncios Generales
          </h3>
          {loading ? (
            <div className="sidebar-banner__empty">Cargando anuncios...</div>
          ) : announcements.length === 0 ? (
            <div className="sidebar-banner__empty">No hay anuncios generales en este momento.</div>
          ) : (
            announcements.map((ann, idx) => (
              <div key={ann.id || idx} className="sidebar-banner__announcement" style={{marginBottom: "1rem"}}>
                <strong>{ann.title}</strong>
                <div
                  className="sidebar-banner__announcement-copy markdown-content"
                  style={{ marginTop: '0.35rem' }}
                  dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(ann.content) || '<p></p>' }}
                />
                <small style={{display: "block", marginTop: "0.5rem", color: "#666"}}>
                  {new Date(ann.created_at).toLocaleDateString('es-CO')}
                </small>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-banner__section">
          <h3 className="sidebar-banner__section-title">
            <span>📅</span> Próximos Eventos
          </h3>
          
          {loading ? (
            <div className="sidebar-banner__empty">
              <div className="spinner" style={{width: '20px', height: '20px', margin: '0 auto 0.5rem auto'}}></div>
              Cargando eventos...
            </div>
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
    </>
  )
}
