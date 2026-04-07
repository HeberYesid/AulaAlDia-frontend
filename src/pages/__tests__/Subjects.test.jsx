import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Subjects from '../Subjects'
import { api } from '../../api/axios'

vi.mock('../../state/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      role: 'ADMIN',
      email: 'admin@test.com',
    },
  }),
}))

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

describe('Subjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({ data: [] })
      }
      if (url === '/api/v1/courses/courses/') {
        return Promise.resolve({ data: [{ id: 7, display_name: '6A' }] })
      }
      if (url === '/api/v1/auth/tenant-users/') {
        return Promise.resolve({ data: [{ id: 17, full_name: 'Docente Uno', email: 'docente1@test.com' }] })
      }
      return Promise.resolve({ data: [] })
    })
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

    await user.type(screen.getByLabelText(/Nombre/i), 'Histora')
    await user.selectOptions(screen.getByLabelText(/Curso/i), '7')
    await user.selectOptions(screen.getByLabelText(/Docente/i), '17')
    await user.click(screen.getByRole('button', { name: /Crear Materia/i }))

    expect(
      await screen.findByText(/Ya existe una materia con un nombre igual o muy parecido/i)
    ).toBeInTheDocument()
  })
})
