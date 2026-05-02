import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Courses from '../curriculums/Courses'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Courses', () => {
  const mockCourseResponses = (courses = []) => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/courses/') {
        return Promise.resolve({ data: courses })
      }

      if (url === '/api/v1/courses/grade-levels/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: '6to',
            },
          ],
        })
      }

      if (url === '/api/v1/courses/course-sections/') {
        return Promise.resolve({ data: [] })
      }

      if (url === '/api/v1/courses/curriculums/') {
        return Promise.resolve({ data: [] })
      }

      if (url === '/api/v1/courses/school-years/') {
        return Promise.resolve({
          data: [
            {
              id: 9,
              label: '2026-2027',
              start_date: '2026-01-01',
              end_date: '2026-12-31',
              is_active: true,
            },
          ],
        })
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCourseResponses()

    api.post.mockResolvedValue({ data: { id: 123 } })
    api.delete.mockResolvedValue({ data: {} })
  })

  it('opens the create modal without a school year selector and posts with active school_year', async () => {
    const user = userEvent.setup()

    render(<Courses />)

    expect(await screen.findByText('No hay cursos registrados.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Nuevo Curso/i }))

    expect(screen.queryByText(/Año Académico/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Año Académico/i })).not.toBeInTheDocument()

    const dialog = screen.getByRole('dialog')
    const [displayNameInput] = within(dialog).getAllByRole('textbox')
    const [gradeLevelSelect] = within(dialog).getAllByRole('combobox')

    await user.type(displayNameInput, '6A')
    await user.selectOptions(gradeLevelSelect, '1')
    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/courses/', expect.any(Object))
    })

    const payload = api.post.mock.calls[0][1]
    expect(payload).toMatchObject({
      display_name: '6A',
      grade_level: '1',
      section: null,
      curriculum_id: null,
      school_year: 9,
      is_active: true,
    })
  })

  it('shows a delete confirmation and removes a course', async () => {
    const user = userEvent.setup()

    mockCourseResponses([
      {
        id: 1,
        display_name: '6A',
        grade_level: 1,
        section: null,
        school_year: 9,
        is_active: true,
      },
    ])

    render(<Courses />)

    const courseName = await screen.findByText('6A')
    const courseRow = courseName.closest('tr')

    await user.click(within(courseRow).getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent('¿Eliminar curso?')

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/v1/courses/courses/1/')
    })
  })
})
