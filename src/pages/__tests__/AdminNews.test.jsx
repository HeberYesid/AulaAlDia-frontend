import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNews from '../AdminNews'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

function mockApiResponses({ feed = [], courses = [] } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/api/v1/courses/calendar/news_feed/') {
      return Promise.resolve({ data: feed })
    }

    if (url === '/api/v1/courses/courses/') {
      return Promise.resolve({ data: courses })
    }

    return Promise.reject(new Error(`Unexpected url: ${url}`))
  })

  api.post.mockResolvedValue({ data: {} })
  api.put.mockResolvedValue({ data: {} })
  api.delete.mockResolvedValue({ data: {} })
}

describe('AdminNews page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the summary-only layout without the timeline or guide', async () => {
    mockApiResponses({
      courses: [{ id: 1, display_name: '6A' }],
      feed: [
        {
          id: 'announcement-1',
          item_type: 'ANNOUNCEMENT',
          title: 'Anuncio de bienvenida',
          content: 'Hola **mundo** <script>alert(1)</script>',
          target_scope: 'ALL',
          target_roles: [],
          target_courses: [],
          created_at: '2026-04-28T10:00:00.000Z',
          relevant_at: '2026-04-28T10:00:00.000Z',
          is_active: true,
          published_by: { email: 'admin@example.com' },
        },
        {
          id: 'event-1',
          item_type: 'EVENT',
          title: 'Reunión general',
          description: 'Agenda con **prioridad**',
          target_scope: 'ALL',
          target_roles: [],
          target_courses: [],
          start_time: '2026-05-01T14:00:00.000Z',
          end_time: '2026-05-01T15:00:00.000Z',
          created_at: '2026-04-28T12:00:00.000Z',
          relevant_at: '2026-05-01T14:00:00.000Z',
        },
      ],
    })

    render(<AdminNews />)

    const summary = screen.getByLabelText('Resumen de publicaciones')
    await waitFor(() => {
      expect(within(summary).getByText('2')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: 'Publicaciones institucionales' })).toBeInTheDocument()
    expect(screen.getByText('Publicaciones visibles')).toBeInTheDocument()
    expect(screen.getByText('Anuncios')).toBeInTheDocument()
    expect(screen.getByText('Eventos programados')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /Timeline de novedades/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Cronología')).not.toBeInTheDocument()
    expect(screen.queryByText('Publicaciones recientes')).not.toBeInTheDocument()
    expect(screen.queryByText('Guía rápida')).not.toBeInTheDocument()
    expect(screen.queryByText('Cómo funciona este panel')).not.toBeInTheDocument()
    expect(screen.queryByText('Vista previa')).not.toBeInTheDocument()
  })

  it('creates an announcement from the unified modal', async () => {
    mockApiResponses({
      courses: [{ id: 10, display_name: '10A' }],
      feed: [],
    })

    const user = userEvent.setup()
    render(<AdminNews />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Crear publicación/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Crear publicación/i }))
    await user.type(screen.getByLabelText('Título'), 'Boletín general')
    await user.type(screen.getByLabelText('Contenido / Descripción'), 'Texto del anuncio')
    await user.selectOptions(screen.getByLabelText('Alcance'), 'ROLES')
    await user.click(screen.getByLabelText('Alumnos'))
    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/courses/announcements/',
        expect.objectContaining({
          title: 'Boletín general',
          content: 'Texto del anuncio',
          target_scope: 'ROLES',
          target_roles: ['STUDENT'],
          target_courses: [],
          is_active: true,
        })
      )
    })
  })

  it('creates an event from the unified modal', async () => {
    mockApiResponses({
      courses: [{ id: 20, display_name: '7B' }],
      feed: [],
    })

    const user = userEvent.setup()
    render(<AdminNews />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Crear publicación/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Crear publicación/i }))
    await user.click(screen.getByRole('button', { name: /^Evento Programado\b/i }))
    await user.type(screen.getByLabelText('Título'), 'Reunión de padres')
    await user.type(screen.getByLabelText('Contenido / Descripción'), 'Traer cuaderno')
    await user.selectOptions(screen.getByLabelText('Alcance'), 'COURSES')
    await waitFor(() => {
      expect(screen.getByLabelText('7B')).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText('7B'))
    await user.type(screen.getByLabelText('Inicio'), '2026-05-20T14:30')
    await user.type(screen.getByLabelText('Fin'), '2026-05-20T15:30')
    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/courses/calendar/',
        expect.objectContaining({
          title: 'Reunión de padres',
          description: 'Traer cuaderno',
          event_type: 'OTHER',
          target_scope: 'COURSES',
          target_courses: [20],
          subject: null,
          course_subject: null,
          start_time: expect.any(String),
          end_time: expect.any(String),
        })
      )
    })
  })

})