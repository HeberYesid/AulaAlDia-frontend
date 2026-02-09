import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchSubjects()
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [selectedSubject])

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/api/v1/courses/subjects/')
      setSubjects(data.results || data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchEvents = async () => {
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
  }

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
    <div className="calendar-page">
      <div className="header-actions" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Calendario Académico</h1>
        
        <div className="filters">
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          >
            <option value="">Todas las materias</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
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
          onSelectEvent={event => alert(`${event.title}\n${event.description || ''}`)}
        />
      </div>
    </div>
  )
}
