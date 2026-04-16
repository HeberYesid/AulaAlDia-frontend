import { useMemo } from 'react'
import { useAuth } from '../state/AuthContext'
import { useSchedules } from '../hooks/useSchedules'

const WEEK_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

export default function Schedules() {
  const { user } = useAuth()
  const {
    loading,
    saving,
    error,
    timezone,
    groupedByDay,
    emptyState,
    linkedStudents,
    selectedStudentId,
    setSelectedStudentId,
    teacherDate,
    setTeacherDate,
    subjects,
    periods,
    form,
    setForm,
    canEdit,
    createSlot,
  } = useSchedules(user)

  const dayEntries = useMemo(() => {
    return WEEK_DAYS.map((label, index) => ({
      index,
      label,
      slots: groupedByDay[index] || [],
    }))
  }, [groupedByDay])

  const role = user?.role

  return (
    <section className="fade-in" style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <div className="card">
        <h1 style={{ marginBottom: 'var(--space-sm)' }}>Horarios</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {timezone
            ? `Visualización institucional fija en timezone: ${timezone}`
            : 'Gestión y consulta institucional de franjas horarias por rol.'}
        </p>
      </div>

      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}

      {role === 'TUTOR' && linkedStudents.length > 0 ? (
        <div className="card">
          <label htmlFor="schedule-student-select">Estudiante vinculado</label>
          <select
            id="schedule-student-select"
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
          >
            {linkedStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {[student.first_name, student.last_name].filter(Boolean).join(' ').trim() || student.email}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {role === 'TEACHER' ? (
        <div className="card">
          <label htmlFor="schedule-teacher-date">Fecha</label>
          <input
            id="schedule-teacher-date"
            type="date"
            value={teacherDate}
            onChange={(event) => setTeacherDate(event.target.value)}
          />
        </div>
      ) : null}

      {canEdit ? (
        <div className="card" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>Nueva franja</h2>
          <div className="grid cols-2">
            <div className="form-group">
              <label htmlFor="schedule-subject">Materia</label>
              <select
                id="schedule-subject"
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              >
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="schedule-period">Período académico</label>
              <select
                id="schedule-period"
                value={form.academic_period}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, academic_period: event.target.value }))
                }
              >
                {periods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label || `${item.year} · ${item.sequence}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="schedule-day">Día</label>
              <select
                id="schedule-day"
                value={form.day_of_week}
                onChange={(event) => setForm((prev) => ({ ...prev, day_of_week: event.target.value }))}
              >
                {WEEK_DAYS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label htmlFor="schedule-start">Inicio</label>
                <input
                  id="schedule-start"
                  type="time"
                  value={form.start_time.slice(0, 5)}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, start_time: `${event.target.value}:00` }))
                  }
                />
              </div>
              <div>
                <label htmlFor="schedule-end">Fin</label>
                <input
                  id="schedule-end"
                  type="time"
                  value={form.end_time.slice(0, 5)}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, end_time: `${event.target.value}:00` }))
                  }
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={createSlot} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar franja'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Grilla semanal</h2>
        {loading ? (
          <div className="loading">
            <div className="spinner" role="status" aria-label="Cargando horarios"></div>
            <span aria-hidden="true">Cargando horarios...</span>
          </div>
        ) : emptyState ? (
          <div className="empty-state" role="status" aria-live="polite">
            <h3>{emptyState.title}</h3>
            <p>{emptyState.message}</p>
          </div>
        ) : (
          <div className="data-table">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Franjas</th>
                </tr>
              </thead>
              <tbody>
                {dayEntries.map((day) => (
                  <tr key={day.index}>
                    <td data-label="Día">{day.label}</td>
                    <td data-label="Franjas" style={{ whiteSpace: 'normal' }}>
                      {day.slots.length === 0
                        ? '—'
                        : day.slots
                            .map(
                              (slot) =>
                                `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)} · ${slot.subject_name}`
                            )
                            .join(' | ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!canEdit ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>
          Solo lectura. La edición de horarios está habilitada únicamente para ADMIN.
        </div>
      ) : null}
    </section>
  )
}
