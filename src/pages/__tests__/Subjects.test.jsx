import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Subjects from '../Subjects'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}))

const mockUseAuth = vi.hoisted(() => vi.fn())

vi.mock('../../state/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

describe('Subjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        role: 'ADMIN',
        email: 'admin@test.com',
      },
    })
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({ data: [] })
      }
      if (url === '/api/v1/courses/courses/') {
        return Promise.resolve({ data: [{ id: 7, display_name: '6A' }] })
      }
      if (url === '/api/v1/auth/tenant-users/') {
        return Promise.resolve({
          data: [{ id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' }],
        })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it('loads only assigned subjects for teacher without requesting courses catalog', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 17,
        role: 'TEACHER',
        email: 'teacher@test.com',
      },
    })

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({
          data: [
            {
              id: 99,
              name: 'Matemáticas',
              course: { id: 1, display_name: '7A', grade_level_id: 7, grade_level: 'Séptimo' },
              teacher: { id: 17, email: 'teacher@test.com' },
            },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    })

    render(
      <MemoryRouter>
        <Subjects />
      </MemoryRouter>
    )

    expect(await screen.findByText('Matemáticas')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/v1/courses/subjects/')
    expect(api.get).not.toHaveBeenCalledWith('/api/v1/courses/courses/')
  })

  it('shows the backend validation message when subject creation fails', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValue({
      response: {
        data: {
          name: ['Ya existe una materia con un nombre igual o muy parecido: "Historia".'],
        },
      },
    })

    render(
      <MemoryRouter>
        <Subjects />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/v1/courses/subjects/')
      expect(api.get).toHaveBeenCalledWith('/api/v1/courses/courses/')
      expect(api.get).toHaveBeenCalledWith('/api/v1/auth/tenant-users/', {
        params: {
          role: 'TEACHER',
          status: 'active',
        },
      })
    })

    await user.click(screen.getByRole('button', { name: /nueva materia/i }))

    await user.type(screen.getByLabelText(/Nombre/i), 'Histora')
    await user.selectOptions(screen.getByLabelText(/Curso/i), '7')
    await user.selectOptions(screen.getByLabelText(/Docente/i), '17')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    expect(
      await screen.findByText(/Ya existe una materia con un nombre igual o muy parecido/i)
    ).toBeInTheDocument()
  })

  it('groups subjects by grade in collapsible sections', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({
          data: [
            {
              id: 11,
              name: 'Matemáticas',
              course: { id: 1, display_name: '1A', grade_level_id: 1, grade_level: 'Primero' },
              teacher: { id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' },
            },
            {
              id: 12,
              name: 'Lengua',
              course: { id: 1, display_name: '1A', grade_level_id: 1, grade_level: 'Primero' },
              teacher: { id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' },
            },
            {
              id: 13,
              name: 'Ciencias',
              course: { id: 2, display_name: '2A', grade_level_id: 2, grade_level: 'Segundo' },
              teacher: { id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' },
            },
          ],
        })
      }
      if (url === '/api/v1/courses/courses/') {
        return Promise.resolve({ data: [{ id: 1, display_name: '1A' }, { id: 2, display_name: '2A' }] })
      }
      if (url === '/api/v1/auth/tenant-users/') {
        return Promise.resolve({
          data: [{ id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' }],
        })
      }
      return Promise.resolve({ data: [] })
    })

    render(
      <MemoryRouter>
        <Subjects />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Gestión de Materias')).toBeInTheDocument()
    })

    expect(screen.getByText('Primero')).toBeInTheDocument()
    expect(screen.getByText('Segundo')).toBeInTheDocument()
    expect(screen.getByText('2 materias')).toBeInTheDocument()
    expect(screen.getByText('1 materia')).toBeInTheDocument()

    const mySubjectsCard = screen.getByRole('heading', { name: /listado por grado/i }).closest('.card')
    expect(mySubjectsCard).toBeTruthy()

    const mySubjectsScope = within(mySubjectsCard)
    expect(mySubjectsScope.getByText('Matemáticas')).toBeInTheDocument()
    expect(mySubjectsScope.getByText('Lengua')).toBeInTheDocument()
    expect(mySubjectsScope.getByText('Ciencias')).toBeInTheDocument()
    expect(mySubjectsScope.getAllByText('Docente Uno')).toHaveLength(3)
  })

  it('expands and collapses all grade groups with action buttons', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({
          data: [
            {
              id: 21,
              name: 'Matemáticas',
              course: { id: 1, display_name: '1A', grade_level_id: 1, grade_level: 'Primero' },
              teacher: { id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' },
            },
            {
              id: 22,
              name: 'Ciencias',
              course: { id: 2, display_name: '2A', grade_level_id: 2, grade_level: 'Segundo' },
              teacher: { id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' },
            },
          ],
        })
      }
      if (url === '/api/v1/courses/courses/') {
        return Promise.resolve({ data: [{ id: 1, display_name: '1A' }, { id: 2, display_name: '2A' }] })
      }
      if (url === '/api/v1/auth/tenant-users/') {
        return Promise.resolve({
          data: [{ id: 17, first_name: 'Docente', last_name: 'Uno', email: 'docente1@test.com' }],
        })
      }
      return Promise.resolve({ data: [] })
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Subjects />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Gestión de Materias')).toBeInTheDocument()
    })

    const collapseAllButton = screen.getByRole('button', { name: /contraer todos/i })
    const expandAllButton = screen.getByRole('button', { name: /expandir todos/i })
    const firstGradeGroup = screen.getByText('Primero').closest('details')
    const secondGradeGroup = screen.getByText('Segundo').closest('details')

    expect(firstGradeGroup).toBeTruthy()
    expect(secondGradeGroup).toBeTruthy()

    await user.click(collapseAllButton)

    await waitFor(() => {
      expect(firstGradeGroup).not.toHaveAttribute('open')
      expect(secondGradeGroup).not.toHaveAttribute('open')
      expect(collapseAllButton).toBeDisabled()
    })

    await user.click(expandAllButton)

    await waitFor(() => {
      expect(firstGradeGroup).toHaveAttribute('open')
      expect(secondGradeGroup).toHaveAttribute('open')
      expect(expandAllButton).toBeDisabled()
    })
  })
})
