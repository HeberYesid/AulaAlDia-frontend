import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminBulletins from '../AdminBulletins'
import { api } from '../../api/axios'
import { useAuth } from '../../state/AuthContext'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
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

function renderComponent() {
  return render(
    <MemoryRouter>
      <AdminBulletins />
    </MemoryRouter>
  )
}

describe('AdminBulletins page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      logout: vi.fn(),
    })
  })

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}))

    renderComponent()

    expect(screen.getByText('Cargando boletines institucionales...')).toBeInTheDocument()
  })

  it('renders list and filters by search and period', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        bulletins: [
          {
            id: 1,
            student_name: 'Ana Perez',
            student_email: 'ana@example.com',
            period_number: 1,
            period_label: '2026 - Periodo 1',
            average_grade: 4.3,
            total_subjects: 5,
            created_at: '2026-03-20T12:00:00Z',
          },
          {
            id: 2,
            student_name: 'Luis Gomez',
            student_email: 'luis@example.com',
            period_number: 2,
            period_label: '2026 - Periodo 2',
            average_grade: 3.7,
            total_subjects: 6,
            created_at: '2026-06-20T12:00:00Z',
          },
        ],
      },
    })

    const user = userEvent.setup()
    renderComponent()

    expect(await screen.findByText('Boletines institucionales')).toBeInTheDocument()
    expect(screen.getByText('Ana Perez')).toBeInTheDocument()
    expect(screen.getByText('Luis Gomez')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar estudiante o periodo'), 'luis')

    await waitFor(() => {
      expect(screen.queryByText('Ana Perez')).not.toBeInTheDocument()
      expect(screen.getByText('Luis Gomez')).toBeInTheDocument()
    })

    await user.clear(screen.getByLabelText('Buscar estudiante o periodo'))
    await user.selectOptions(screen.getByLabelText('Filtrar por periodo'), '1')

    await waitFor(() => {
      expect(screen.getByText('Ana Perez')).toBeInTheDocument()
      expect(screen.queryByText('Luis Gomez')).not.toBeInTheDocument()
    })
  })

  it('loads and shows detail when row is expanded', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        bulletins: [
          {
            id: 1,
            student_name: 'Ana Perez',
            student_email: 'ana@example.com',
            period_number: 1,
            period_label: '2026 - Periodo 1',
            average_grade: 4.3,
            total_subjects: 1,
            created_at: '2026-03-20T12:00:00Z',
          },
        ],
      },
    })
    api.get.mockResolvedValueOnce({
      data: {
        id: 1,
        student_name: 'Ana Perez',
        student_email: 'ana@example.com',
        period_label: '2026 - Periodo 1',
        entries: [
          {
            id: 101,
            subject_name: 'Matematicas',
            subject_code: 'MAT-1',
            grade: 4.3,
            average_score: 4.1,
            graded_count: 3,
            submitted_count: 3,
            absence_count: 0,
            unjustified_absence_count: 0,
            observations_summary: '',
          },
        ],
      },
    })

    const user = userEvent.setup()
    renderComponent()

    expect(await screen.findByText('Ana Perez')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ver detalle de ana@example.com/i }))

    await waitFor(() => {
      expect(screen.getByText(/Detalle de Ana Perez/)).toBeInTheDocument()
      expect(screen.getByText('Matematicas')).toBeInTheDocument()
    })
  })
})
