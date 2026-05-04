import { act, render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AppTour from '../AppTour'
import { TourProvider } from '../../state/TourContext'

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
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    document.body.innerHTML = `
      <button class="theme-toggle">Tema</button>
      <div class="notification-bell">Notificaciones</div>
      <div class="dashboard-header">Dashboard</div>
      <div class="welcome-panel">Welcome</div>
      <div class="stats-grid">Stats</div>
      <div class="support-tickets__hero">Hero</div>
      <form class="support-tickets__form"></form>
      <nav class="sidebar__nav">
        <a href="/admin/dashboard" data-tour-id="nav-admin-dashboard">Dashboard</a>
        <a href="/admin/news" data-tour-id="nav-admin-news">Novedades</a>
        <a href="/admin/support" data-tour-id="nav-admin-support">Atención al Cliente</a>
        <a href="/subjects" data-tour-id="nav-subjects">Materias</a>
        <a href="/messages" data-tour-id="nav-messages">Mensajes</a>
        <a href="/calendar" data-tour-id="nav-calendar">Calendario</a>
        <a href="/schedules" data-tour-id="nav-schedules">Horarios</a>
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

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderTour(initialEntries) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <TourProvider>
          <AppTour />
        </TourProvider>
      </MemoryRouter>
    )
  }

  it('starts the admin tour on the admin dashboard route', async () => {
    renderTour(['/admin/dashboard'])

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(joyrideMock).toHaveBeenCalled()
    const lastCall = joyrideMock.mock.calls.at(-1)?.[0]
    expect(lastCall.run).toBe(true)
    expect(lastCall.steps[0].target).toBe('body')
  })

  it('does not start the admin tour on the root route', async () => {
    renderTour(['/'])

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(joyrideMock).not.toHaveBeenCalled()
  })

  it('starts the new versioned tour even when the legacy completion key exists', async () => {
    localStorage.setItem('aulaaldia-tour-completed-ADMIN', 'true')
    useAuthMock.mockReturnValue({
      user: {
        id: 99,
        role: 'ADMIN',
        is_global_admin: true,
      },
    })

    renderTour(['/admin/dashboard'])

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(joyrideMock).toHaveBeenCalled()
    const lastCall = joyrideMock.mock.calls.at(-1)?.[0]
    expect(lastCall.run).toBe(true)
  })

  it('advances to the next module when Joyride emits finished on finalizar', async () => {
    renderTour(['/admin/dashboard'])

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    const firstCall = joyrideMock.mock.calls.at(-1)?.[0]

    await act(async () => {
      firstCall.callback({
        action: 'next',
        status: 'finished',
        type: 'tour:end',
      })
      await Promise.resolve()
    })

    const progress = JSON.parse(localStorage.getItem('aulaaldia-tour-progress-v2-ADMIN-1'))
    expect(progress.currentModuleIndex).toBe(1)
    expect(progress.status).toBe('active')
  })

  it('still advances when Joyride reports close together with finished', async () => {
    renderTour(['/admin/dashboard'])

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    const firstCall = joyrideMock.mock.calls.at(-1)?.[0]

    await act(async () => {
      firstCall.callback({
        action: 'close',
        status: 'finished',
        type: 'tour:end',
      })
      await Promise.resolve()
    })

    const progress = JSON.parse(localStorage.getItem('aulaaldia-tour-progress-v2-ADMIN-1'))
    expect(progress.currentModuleIndex).toBe(1)
    expect(progress.status).toBe('active')
  })
})
