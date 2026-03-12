import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TenantOperationsAudit from '../TenantOperationsAudit'
import { useAuth } from '../../state/AuthContext'
import { api } from '../../api/axios'

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('TenantOperationsAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks access for non-admin users', () => {
    useAuth.mockReturnValue({
      user: { role: 'TEACHER' },
      activeTenantId: '11111111-1111-1111-1111-111111111111',
    })

    render(<TenantOperationsAudit />)

    expect(screen.getByText(/acceso restringido/i)).toBeInTheDocument()
  })

  it('loads audits and applies filters', async () => {
    const user = userEvent.setup()
    useAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      activeTenantId: '11111111-1111-1111-1111-111111111111',
    })

    api.get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 1,
              category: 'ACADEMIC',
              action: 'SUBJECT_CREATED',
              summary: 'Creó una materia',
              actor_email: 'admin@test.com',
              method: 'POST',
              path: '/api/v1/courses/subjects/',
              metadata: {},
              created_at: '2026-03-12T15:00:00Z',
            },
          ],
          offset: 0,
          total_count: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [],
          offset: 0,
          total_count: 0,
        },
      })

    render(<TenantOperationsAudit />)

    expect(await screen.findByText(/operaciones recientes/i)).toBeInTheDocument()
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      '/api/v1/auth/tenant-operation-audits/',
      expect.objectContaining({
        params: expect.objectContaining({
          limit: 20,
          order: 'desc',
        }),
      })
    )

    await user.type(screen.getByLabelText(/actor/i), 'admin@')
    await user.selectOptions(screen.getByLabelText(/categoría/i), 'ACADEMIC')
    await user.click(screen.getByRole('button', { name: /aplicar filtros/i }))

    await waitFor(() => {
      expect(api.get).toHaveBeenNthCalledWith(
        2,
        '/api/v1/auth/tenant-operation-audits/',
        expect.objectContaining({
          params: expect.objectContaining({
            actor_email: 'admin@',
            category: 'ACADEMIC',
          }),
        })
      )
    })
  })
})