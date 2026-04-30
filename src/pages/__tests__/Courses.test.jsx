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
  },
}))

describe('Courses', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/courses/') {
        return Promise.resolve({ data: [] })
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
            },
          ],
        })
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    api.post.mockResolvedValue({ data: { id: 123 } })
  })

  it('opens the create modal without a school year selector and posts without school_year', async () => {
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
    expect(payload).not.toHaveProperty('school_year')
    expect(payload).toMatchObject({
      display_name: '6A',
      grade_level: '1',
      section: null,
      curriculum_id: null,
      is_active: true,
    })
  })
})