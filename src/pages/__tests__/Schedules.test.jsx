import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Schedules from '../Schedules'

const useAuthMock = vi.fn()
const useSchedulesMock = vi.fn()

vi.mock('../../state/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../hooks/useSchedules', () => ({
  useSchedules: (...args) => useSchedulesMock(...args),
}))

function baseHookState(overrides = {}) {
  return {
    loading: false,
    saving: false,
    error: '',
    timezone: 'America/Bogota',
    groupedByDay: {},
    emptyState: null,
    linkedStudents: [],
    selectedStudentId: '',
    setSelectedStudentId: vi.fn(),
    teacherDate: '2026-04-14',
    setTeacherDate: vi.fn(),
    subjects: [],
    periods: [],
    form: {
      subject: '',
      academic_period: '',
      day_of_week: 0,
      start_time: '08:00:00',
      end_time: '09:00:00',
    },
    setForm: vi.fn(),
    canEdit: false,
    createSlot: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Schedules />
    </MemoryRouter>
  )
}

describe('Schedules page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows informative empty state and read-only for tutor', async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, role: 'TUTOR' } })
    useSchedulesMock.mockReturnValue(
      baseHookState({
        emptyState: {
          title: 'No hay horario cargado',
          message: 'Aún no hay franjas horarias configuradas para esta vista semanal.',
        },
      })
    )

    renderPage()

    expect(screen.getByRole('heading', { name: /horarios/i })).toBeInTheDocument()
    expect(screen.getByText(/No hay horario cargado/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Solo lectura\. La edición de horarios está habilitada únicamente para ADMIN\./i)
    ).toBeInTheDocument()
  })

  it('shows tutor linked-student selector', async () => {
    const setSelectedStudentId = vi.fn()

    useAuthMock.mockReturnValue({ user: { id: 1, role: 'TUTOR' } })
    useSchedulesMock.mockReturnValue(
      baseHookState({
        linkedStudents: [
          { id: 10, first_name: 'Ana', last_name: 'Pérez', email: 'ana@example.com' },
          { id: 11, first_name: 'Juan', last_name: 'García', email: 'juan@example.com' },
        ],
        selectedStudentId: '10',
        setSelectedStudentId,
      })
    )

    renderPage()

    fireEvent.change(screen.getByLabelText(/estudiante vinculado/i), { target: { value: '11' } })

    await waitFor(() => {
      expect(setSelectedStudentId).toHaveBeenCalledWith('11')
    })
  })

  it('renders admin editor and allows save action', async () => {
    const createSlot = vi.fn()

    useAuthMock.mockReturnValue({ user: { id: 2, role: 'ADMIN' } })
    useSchedulesMock.mockReturnValue(
      baseHookState({
        canEdit: true,
        subjects: [{ id: 50, name: 'Matemática' }],
        periods: [{ id: 7, label: '2026 - Periodo 1', year: 2026, sequence: 1 }],
        form: {
          subject: '50',
          academic_period: '7',
          day_of_week: 1,
          start_time: '08:00:00',
          end_time: '09:00:00',
        },
        createSlot,
      })
    )

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /guardar franja/i }))

    await waitFor(() => {
      expect(createSlot).toHaveBeenCalled()
    })
  })

  it('shows weekly rows from grouped slots', async () => {
    useAuthMock.mockReturnValue({ user: { id: 3, role: 'STUDENT' } })
    useSchedulesMock.mockReturnValue(
      baseHookState({
        groupedByDay: {
          1: [
            {
              start_time: '08:00:00',
              end_time: '09:00:00',
              subject_name: 'Matemática',
            },
          ],
        },
      })
    )

    renderPage()
    expect(screen.getByText(/08:00-09:00 · Matemática/i)).toBeInTheDocument()
  })
})
