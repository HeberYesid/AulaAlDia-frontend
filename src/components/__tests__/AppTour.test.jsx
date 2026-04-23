import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppTour from '../AppTour'

const joyrideMock = vi.fn(() => null)
const useAuthMock = vi.fn()

vi.mock('react-joyride', () => ({
  default: (props) => joyrideMock(props),
  ACTIONS: { PREV: 'prev', CLOSE: 'close' },
  EVENTS: { STEP_AFTER: 'step:after', TOUR_END: 'tour:end' },
  STATUS: { FINISHED: 'finished', SKIPPED: 'skipped' },
}))

vi.mock('../../state/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

describe('AppTour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.body.innerHTML = `
      <button class="theme-toggle">Tema</button>
      <div class="notification-bell">Notificaciones</div>
      <div class="dashboard-header">Dashboard</div>
      <div class="stats-grid">Stats</div>
      <nav class="sidebar__nav">
        <a href="/subjects" data-tour-id="nav-subjects">Materias</a>
        <a href="/messages" data-tour-id="nav-messages">Mensajes</a>
        <a href="/calendar" data-tour-id="nav-calendar">Calendario</a>
        <a href="/observer" data-tour-id="nav-observer">Observador</a>
        <a href="/absences" data-tour-id="nav-absences">Asistencia</a>
        <a href="/admin/academic-settings" data-tour-id="nav-admin-academic-settings">Configuración académica</a>
        <a href="/admin/commercial" data-tour-id="nav-admin-commercial">Comercial</a>
      </nav>
      <a class="sidebar__profile" href="/profile">Perfil</a>
    `
    useAuthMock.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN',
        is_global_admin: true,
      },
    })
  })

  it('starts the admin tour on the admin dashboard route', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AppTour />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(joyrideMock).toHaveBeenCalled()
      const lastCall = joyrideMock.mock.calls.at(-1)?.[0]
      expect(lastCall.run).toBe(true)
      expect(lastCall.steps.length).toBeGreaterThan(3)
      expect(lastCall.steps.some((step) => step.target === '[data-tour-id="nav-admin-academic-settings"]')).toBe(true)
    })
  })

  it('does not start the admin tour on the root route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppTour />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(joyrideMock).toHaveBeenCalled()
    })

    const lastCall = joyrideMock.mock.calls.at(-1)?.[0]
    expect(lastCall.run).toBe(false)
  })

  it('starts tour for a new user even when legacy role-only key exists', async () => {
    localStorage.setItem('aulaaldia-tour-completed-ADMIN', 'true')
    useAuthMock.mockReturnValue({
      user: {
        id: 99,
        role: 'ADMIN',
        is_global_admin: true,
      },
    })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AppTour />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(joyrideMock).toHaveBeenCalled()
      const lastCall = joyrideMock.mock.calls.at(-1)?.[0]
      expect(lastCall.run).toBe(true)
    })
  })
})
