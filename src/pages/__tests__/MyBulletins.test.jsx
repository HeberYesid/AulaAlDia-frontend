import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyBulletins from '../MyBulletins'
import { api } from '../../api/axios'
import { useAuth } from '../../state/AuthContext'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn(),
}))

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderComponent = () => render(
  <MemoryRouter>
    <MyBulletins />
  </MemoryRouter>
)

describe('MyBulletins page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({
      user: { id: 1 },
      logout: vi.fn(),
    })
  })

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}))

    renderComponent()

    expect(screen.getByText('Cargando boletines...')).toBeInTheDocument()
  })

  it('renders empty scenario correctly', async () => {
    api.get.mockResolvedValueOnce({ data: { bulletins: [] } })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No tienes boletines disponibles')).toBeInTheDocument()
    })
  })

  it('renders bulletins grouped by year', async () => {
    const bulletins = [
      {
        id: 1,
        year: 2023,
        period_number: 1,
        period_label: 'Per 1',
        average_grade: 4.0,
        total_subjects: 5,
        official_status: 'APPROVED',
        can_download_official_pdf: false,
        financial_hold_active: false,
        created_at: '2023-03-01T00:00:00Z',
      },
    ]
    api.get.mockResolvedValueOnce({ data: { bulletins } })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Mis Boletines/)).toBeInTheDocument()
      expect(screen.getByText(/Año 2023/)).toBeInTheDocument()
      expect(screen.getByText('Periodo 1')).toBeInTheDocument()
      expect(screen.getByText('Aprobado')).toBeInTheDocument()
    })
  })

  it('expands bulletin detail on click', async () => {
    const bulletins = [
      {
        id: 1,
        year: 2023,
        period_number: 1,
        period_label: 'Per 1',
        average_grade: 4.0,
        total_subjects: 1,
        official_status: 'ISSUED',
        can_download_official_pdf: true,
        financial_hold_active: false,
        created_at: '2023-03-01T00:00:00Z',
      },
    ]
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/my-bulletins/') {
        return Promise.resolve({ data: { bulletins } })
      }
      if (url === '/api/v1/courses/my-bulletins/1/') {
        return Promise.resolve({
          data: {
            id: 1,
            period_label: 'Per 1',
            average_grade: 4.0,
            official_status: 'ISSUED',
            can_download_official_pdf: true,
            official_comment: 'Observación oficial',
            entries: [
              {
                id: 101,
                subject_name: 'Math',
                grade: 4.0,
                average_score: 4.0,
                graded_count: 5,
                submitted_count: 5,
                absence_count: 0,
              },
            ],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected URL ${url}`))
    })

    const user = userEvent.setup()
    renderComponent()

    await user.click(await screen.findByRole('button', { name: /Ver boletín Per 1/i }))

    await waitFor(() => {
      expect(screen.getByText(/Detalle — Per 1/)).toBeInTheDocument()
      expect(screen.getByText('Math')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Descargar PDF oficial/i })).toBeInTheDocument()
      expect(screen.getByText(/Observación oficial/i)).toBeInTheDocument()
    })
  })

  it('shows debt hold message and disables official download', async () => {
    const bulletins = [
      {
        id: 5,
        year: 2026,
        period_number: 2,
        period_label: 'Per 2',
        average_grade: 3.8,
        total_subjects: 4,
        official_status: 'ISSUED',
        can_download_official_pdf: false,
        financial_hold_active: true,
        financial_hold_message: 'Bloqueado por deuda financiera',
        created_at: '2026-06-10T00:00:00Z',
      },
    ]
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/my-bulletins/') {
        return Promise.resolve({ data: { bulletins } })
      }
      if (url === '/api/v1/courses/my-bulletins/5/') {
        return Promise.resolve({
          data: {
            id: 5,
            period_label: 'Per 2',
            average_grade: 3.8,
            official_status: 'ISSUED',
            can_download_official_pdf: false,
            financial_hold_active: true,
            financial_hold_message: 'Bloqueado por deuda financiera',
            entries: [
              {
                id: 201,
                subject_name: 'Science',
                grade: 3.8,
                average_score: 3.8,
                graded_count: 4,
                submitted_count: 4,
                absence_count: 0,
              },
            ],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected URL ${url}`))
    })

    const user = userEvent.setup()

    renderComponent()
    await user.click(await screen.findByRole('button', { name: /Ver boletín Per 2/i }))

    await waitFor(() => {
      expect(screen.getByText(/Bloqueado por deuda financiera/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Descargar PDF oficial/i })).not.toBeInTheDocument()
    })
  })
})
