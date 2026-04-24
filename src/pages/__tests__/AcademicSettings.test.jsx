import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AcademicSettings from '../AcademicSettings'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}))

describe('AcademicSettings', () => {
  const settingsResponse = {
    id: 1,
    period_scheme: 'TRIMESTER',
    min_grade: '1.00',
    max_grade: '5.00',
    passing_grade: '3.00',
    lock_grades_after_deadline: true,
  }

  const periodsResponse = [
    {
      id: 11,
      label: '2026 - Trimestre 1',
      year: 2026,
      period_number: 1,
      sequence: 1,
      name: 'Trimestre 1',
      start_date: '2026-01-15',
      end_date: '2026-03-30',
      grading_deadline: '2026-03-31T05:00:00Z',
      lock_after_deadline: true,
      is_closed: false,
      is_grade_locked: false,
    },
  ]

  let schoolYearsResponse = []

  beforeEach(() => {
    vi.clearAllMocks()
    schoolYearsResponse = []

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/academic-settings/') {
        return Promise.resolve({ data: settingsResponse })
      }
      if (url === '/api/v1/courses/academic-periods/') {
        return Promise.resolve({ data: periodsResponse })
      }
      if (url === '/api/v1/courses/school-years/') {
        return Promise.resolve({ data: schoolYearsResponse })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
  })

  it('loads existing period data into the form and patches it', async () => {
    const user = userEvent.setup()
    api.patch.mockResolvedValue({ data: {} })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()
    expect(screen.getByText(/^Activo$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Desactivar/i })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /^Editar$/i })[0])

    expect(screen.getByRole('heading', { name: /Editar periodo/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Trimestre 1')).toBeInTheDocument()

    const periodNameInput = screen.getByLabelText(/Nombre del periodo/i)
    await user.clear(periodNameInput)
    await user.type(periodNameInput, 'Trimestre 1 actualizado')

    await user.click(screen.getByRole('button', { name: /Guardar periodo/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/v1/courses/academic-periods/11/',
        expect.objectContaining({
          name: 'Trimestre 1 actualizado',
          year: 2026,
          sequence: 1,
          period_number: 1,
        })
      )
    })
  })

  it('shows the active school year context in the period creation form', async () => {
    schoolYearsResponse = [
      {
        id: 5,
        label: '2026-2027',
        start_date: '2026-01-01',
        end_date: '2027-12-31',
        enrollment_open_date: '2026-01-10',
        enrollment_close_date: '2026-02-10',
        evaluation_type: 'TRIMESTER',
        is_active: true,
      },
    ]

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Este periodo se crear. dentro del a.o escolar activo/i)
    ).toBeInTheDocument()
    expect(screen.getAllByText(/2026-2027/i).length).toBeGreaterThan(0)
  })

  it('disables period creation when there is no active school year', async () => {
    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Debes activar un a.o escolar para poder crear periodos acad.micos/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear periodo/i })).toBeDisabled()
  })

  it('activates an inactive period from period actions', async () => {
    const user = userEvent.setup()
    const inactivePeriod = {
      id: 77,
      label: '2026 - Trimestre 2',
      year: 2026,
      period_number: 2,
      sequence: 2,
      name: 'Trimestre 2',
      start_date: '2026-04-01',
      end_date: '2026-06-30',
      grading_deadline: '2026-06-30T05:00:00Z',
      lock_after_deadline: true,
      is_closed: true,
      is_grade_locked: true,
    }
    const activePeriod = { ...inactivePeriod, is_closed: false, is_grade_locked: false }
    let periodsGetCount = 0

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/academic-settings/') {
        return Promise.resolve({ data: settingsResponse })
      }
      if (url === '/api/v1/courses/academic-periods/') {
        periodsGetCount += 1
        return Promise.resolve({ data: periodsGetCount >= 2 ? [activePeriod] : [inactivePeriod] })
      }
      if (url === '/api/v1/courses/school-years/') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    api.patch.mockImplementation((url, payload) => {
      if (url === '/api/v1/courses/academic-periods/88/' && payload?.is_closed === false) {
        return Promise.reject({ response: { status: 404 } })
      }
      return Promise.reject(new Error(`Unexpected PATCH ${url}`))
    })

    api.post.mockResolvedValue({ data: { id: 88, is_closed: false } })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Activar$/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/academic-periods/77/', { is_closed: false })
    })
  })

  it('falls back to activate endpoint when patch status update is unavailable', async () => {
    const user = userEvent.setup()
    const inactivePeriod = {
      id: 88,
      label: '2026 - Trimestre 3',
      year: 2026,
      period_number: 3,
      sequence: 3,
      name: 'Trimestre 3',
      start_date: '2026-07-01',
      end_date: '2026-09-30',
      grading_deadline: '2026-09-30T05:00:00Z',
      lock_after_deadline: true,
      is_closed: true,
      is_grade_locked: true,
    }
    const activePeriod = { ...inactivePeriod, is_closed: false, is_grade_locked: false }
    let periodsGetCount = 0

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/academic-settings/') {
        return Promise.resolve({ data: settingsResponse })
      }
      if (url === '/api/v1/courses/academic-periods/') {
        periodsGetCount += 1
        return Promise.resolve({ data: periodsGetCount >= 2 ? [activePeriod] : [inactivePeriod] })
      }
      if (url === '/api/v1/courses/school-years/') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    api.patch.mockImplementation((url, payload) => {
      if (url === '/api/v1/courses/academic-periods/88/' && payload?.is_closed === false) {
        return Promise.reject({ response: { status: 404 } })
      }
      return Promise.reject(new Error(`Unexpected PATCH ${url}`))
    })

    api.post.mockResolvedValue({ data: { id: 88, is_closed: false } })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Activar$/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/academic-periods/88/', { is_closed: false })
      expect(screen.getByText(/^Activo$/i)).toBeInTheDocument()
    })
  })

  it('shows an error when backend does not change period status after activation attempt', async () => {
    const user = userEvent.setup()
    const inactivePeriodsResponse = [
      {
        id: 77,
        label: '2026 - Trimestre 2',
        year: 2026,
        period_number: 2,
        sequence: 2,
        name: 'Trimestre 2',
        start_date: '2026-04-01',
        end_date: '2026-06-30',
        grading_deadline: '2026-06-30T05:00:00Z',
        lock_after_deadline: true,
        is_closed: true,
        is_grade_locked: true,
      },
    ]

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/academic-settings/') {
        return Promise.resolve({ data: settingsResponse })
      }
      if (url === '/api/v1/courses/academic-periods/') {
        return Promise.resolve({ data: inactivePeriodsResponse })
      }
      if (url === '/api/v1/courses/school-years/') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    api.patch.mockImplementation((url, payload) => {
      if (url === '/api/v1/courses/academic-periods/77/' && payload?.is_closed === false) {
        return Promise.resolve({ data: { id: 77, is_closed: false } })
      }
      return Promise.reject(new Error(`Unexpected PATCH ${url}`))
    })

    api.post.mockResolvedValue({ data: {} })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Activar$/i }))

    await waitFor(() => {
      expect(screen.getByText(/No se pudo activar el periodo academico\. El estado no cambio en el servidor\./i)).toBeInTheDocument()
    })
  })

  it('asks for confirmation with impact details before deactivating a school year', async () => {
    const user = userEvent.setup()
    schoolYearsResponse = [
      {
        id: 99,
        label: '2026',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        enrollment_open_date: '2026-01-10',
        enrollment_close_date: '2026-02-10',
        evaluation_type: 'TRIMESTER',
        is_active: true,
      },
    ]

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/academic-settings/') {
        return Promise.resolve({ data: settingsResponse })
      }
      if (url === '/api/v1/courses/academic-periods/') {
        return Promise.resolve({ data: periodsResponse })
      }
      if (url === '/api/v1/courses/school-years/') {
        return Promise.resolve({ data: schoolYearsResponse })
      }
      if (url === '/api/v1/courses/school-years/99/deactivation-impact/') {
        return Promise.resolve({
          data: {
            school_year: { id: 99, label: '2026' },
            impact: {
              active_school_years_before: 1,
              active_school_years_after: 0,
              academic_periods_in_range: 4,
              open_academic_periods_in_range: 2,
              closed_academic_periods_in_range: 2,
              exercises_linked_to_periods: 18,
              student_results_linked_to_periods: 43,
              bulletins_linked_to_periods: 9,
              enrollments_created_in_window: 55,
            },
            warnings: ['Tu institución quedará sin año escolar activo hasta que actives o crees uno nuevo.'],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    api.post.mockImplementation((url) => {
      if (url === '/api/v1/courses/school-years/99/deactivate/') {
        return Promise.resolve({ data: { id: 99, is_active: false } })
      }
      if (url === '/api/v1/courses/academic-periods/11/deactivate/') {
        return Promise.resolve({ data: { id: 11, is_closed: true } })
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o y periodos/i)).toBeInTheDocument()

    const schoolYearsSection = screen.getByRole('heading', { name: /Años escolares configurados/i }).closest('section')
    expect(schoolYearsSection).not.toBeNull()
    await user.click(within(schoolYearsSection).getByRole('button', { name: /Desactivar/i }))

    expect(await screen.findByRole('heading', { name: /seguro que deseas desactivar este a.o escolar/i })).toBeInTheDocument()
    expect(screen.getByText(/A.os escolares activos: 1 -> 0\./i)).toBeInTheDocument()
    expect(screen.getByText(/Advertencias importantes:/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalledWith('/api/v1/courses/school-years/99/deactivate/')

    await user.click(screen.getByRole('button', { name: /^Confirmar$/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/school-years/99/deactivate/')
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/academic-periods/11/', { is_closed: true })
    })
  })
})
