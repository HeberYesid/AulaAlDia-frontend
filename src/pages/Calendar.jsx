import { useCallback, useEffect, useState } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import es from 'date-fns/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { api } from '../api/axios'
import { useAuth } from '../state/AuthContext'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const fetchSubjects = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/courses/subjects/')
      setSubjects(data.results || data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedSubject) {
        params.subject = selectedSubject
      }
      const { data } = await api.get('/api/v1/courses/calendar/all_events/', { params })
      
      // Convert string dates to Date objects
      const formattedEvents = data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      
      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedSubject])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.color,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }
    return {
      style: style
    }
  }

  return (
    <>
    <div className="calendar-page">
      <div className="header-actions" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Calendario Académico</h1>
        
        <div className="filters">
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            aria-label="Filtrar por materia"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          >
            <option value="">Todas las materias</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ height: '700px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '8px' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture='es'
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango."
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={event => setSelectedEvent(event)}
        />
      </div>
    </div>

      {selectedEvent && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Cerrar evento"
            className="modal-backdrop-button"
            onClick={() => setSelectedEvent(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
            className="card"
            style={{ maxWidth: '450px', width: '100%', margin: 0, position: 'relative', zIndex: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="event-dialog-title" style={{ marginTop: 0 }}>{selectedEvent.title}</h2>
            {selectedEvent.description && <p style={{ color: 'var(--text-secondary)' }}>{selectedEvent.description}</p>}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {selectedEvent.start?.toLocaleDateString('es-CO', { dateStyle: 'full' })}
            </p>
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button className="btn secondary" onClick={() => setSelectedEvent(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
