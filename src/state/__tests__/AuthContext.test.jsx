import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, afterEach, describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { api, AUTH_INVALIDATED_EVENT, setApiActiveTenantId } from '../../api/axios'

const mockAccessToken = { current: null }

vi.mock('../../api/axios', async () => {
  const actual = await vi.importActual('../../api/axios')

  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(),
      post: vi.fn(),
      setAccessToken: vi.fn((token) => { mockAccessToken.current = token || null }),
      getAccessToken: vi.fn(() => mockAccessToken.current),
    },
    setApiActiveTenantId: vi.fn(),
  }
})

function AuthProbe() {
  const { activeTenantId, access, refresh, switchTenant } = useAuth()

  return (
    <div>
      <div data-testid="active-tenant">{activeTenantId || 'none'}</div>
      <div data-testid="access-token">{access || 'none'}</div>
      <div data-testid="refresh-token">{refresh || 'none'}</div>
      <button type="button" onClick={() => switchTenant('tenant-2')}>
        Switch tenant
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  afterEach(() => {
    localStorage.clear()
    mockAccessToken.current = null
    vi.clearAllMocks()
  })

  it('stores returned tokens when switching tenant', async () => {
    let selectedTenantId = 'tenant-1'

    localStorage.setItem(
      'auth',
      JSON.stringify({
        user: { id: 1, role: 'STUDENT', active_tenant_id: 'tenant-1' },
        refresh: 'old-refresh',
        active_tenant_id: 'tenant-1',
      })
    )

    api.setAccessToken('old-access')

    api.post.mockResolvedValue({
      data: {
        access: 'new-access',
        refresh: 'new-refresh',
        active_tenant_id: 'tenant-2',
      },
    })
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/me/') {
        return Promise.resolve({
          data: { id: 1, role: 'STUDENT', active_tenant_id: 'tenant-2' },
        })
      }

      if (url === '/api/v1/auth/my-tenants/') {
        return Promise.resolve({
          data: {
            active_tenant_id: selectedTenantId,
            tenants: [{ tenant_id: selectedTenantId, tenant_name: `Colegio ${selectedTenantId === 'tenant-1' ? '1' : '2'}` }],
          },
        })
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    const user = userEvent.setup()

    await act(async () => {
      render(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('active-tenant')).toHaveTextContent('tenant-1')
    })

    selectedTenantId = 'tenant-2'

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Switch tenant' }))
    })

    await waitFor(() => {
      expect(screen.getByTestId('active-tenant')).toHaveTextContent('tenant-2')
      expect(screen.getByTestId('access-token')).toHaveTextContent('new-access')
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('new-refresh')
    })

    const storedAuth = JSON.parse(localStorage.getItem('auth'))

    expect(storedAuth.access).toBeUndefined()
    expect(storedAuth.refresh).toBe('new-refresh')
    expect(storedAuth.active_tenant_id).toBe('tenant-2')
    expect(api.post).toHaveBeenCalledWith('/api/v1/auth/select-tenant/', {
      tenant_id: 'tenant-2',
    })
    expect(setApiActiveTenantId).toHaveBeenCalledWith('tenant-2')
  })

  it('clears in-memory auth when auth is invalidated externally', async () => {
    localStorage.setItem(
      'auth',
      JSON.stringify({
        user: { id: 1, role: 'STUDENT', active_tenant_id: 'tenant-1' },
        refresh: 'old-refresh',
        active_tenant_id: 'tenant-1',
      })
    )

    api.setAccessToken('old-access')

    api.get.mockResolvedValue({
      data: {
        active_tenant_id: 'tenant-1',
        tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio 1' }],
      },
    })

    await act(async () => {
      render(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('access-token')).toHaveTextContent('old-access')
    })

    await act(async () => {
      localStorage.removeItem('auth')
      window.dispatchEvent(new CustomEvent(AUTH_INVALIDATED_EVENT))
    })

    await waitFor(() => {
      expect(screen.getByTestId('active-tenant')).toHaveTextContent('none')
      expect(screen.getByTestId('access-token')).toHaveTextContent('none')
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('none')
    })

    expect(setApiActiveTenantId).toHaveBeenCalledWith(null)
  })
})