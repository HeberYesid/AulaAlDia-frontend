import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    active_grading_scale: 7,
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

  const scalesResponse = [
    {
      id: 7,
      name: 'Escala institucional',
      description: 'Escala base',
      is_active: true,
      ranges: [
        { id: 1, label: 'Superior', min_value: '4.60', max_value: '5.00', order: 1 },
        { id: 2, label: 'Alto', min_value: '4.00', max_value: '4.59', order: 2 },
      ],
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
      if (url === '/api/v1/courses/grading-scales/') {
        return Promise.resolve({ data: scalesResponse })
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

    expect(await screen.findByText(/configuraci.n del a.o, periodos y escalas/i)).toBeInTheDocument()

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

  it('loads existing scale data into the form and patches it', async () => {
    const user = userEvent.setup()
    api.patch.mockResolvedValue({ data: {} })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o, periodos y escalas/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Editar escala/i }))

    expect(screen.getByRole('heading', { name: /Editar escala/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre de la escala/i)).toHaveValue('Escala institucional')

    const descriptionInput = screen.getByLabelText(/Descripci.n/i)
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Escala actualizada para secundaria')

    await user.click(screen.getByRole('button', { name: /Guardar escala/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/v1/courses/grading-scales/7/',
        expect.objectContaining({
          name: 'Escala institucional',
          description: 'Escala actualizada para secundaria',
          is_active: true,
          ranges: expect.arrayContaining([
            expect.objectContaining({ label: 'Superior' }),
          ]),
        })
      )
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
      if (url === '/api/v1/courses/grading-scales/') {
        return Promise.resolve({ data: scalesResponse })
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
      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })

    render(<AcademicSettings />)

    expect(await screen.findByText(/configuraci.n del a.o, periodos y escalas/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Desactivar/i }))

    expect(await screen.findByRole('heading', { name: /seguro que deseas desactivar este a.o escolar/i })).toBeInTheDocument()
    expect(screen.getByText(/A.os escolares activos: 1 -> 0\./i)).toBeInTheDocument()
    expect(screen.getByText(/Advertencias importantes:/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalledWith('/api/v1/courses/school-years/99/deactivate/')

    await user.click(screen.getByRole('button', { name: /^Confirmar$/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/school-years/99/deactivate/')
    })
  })
})
