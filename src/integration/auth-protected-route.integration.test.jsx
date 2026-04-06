import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../state/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { api, setApiActiveTenantId } from '../api/axios'

vi.mock('../api/axios', async () => {
  const actual = await vi.importActual('../api/axios')

  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(),
      post: vi.fn(),
    },
    setApiActiveTenantId: vi.fn(),
    AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  }
})

function renderProtectedRouteApp(initialPath = '/private') {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/"
            element={(
              <div>
                <div>Home Page</div>
                <Link to="/private">Go Private</Link>
              </div>
            )}
          />
          <Route
            path="/private"
            element={(
              <ProtectedRoute requireTenant>
                <div>Private Page</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function setStoredAuth(overrides = {}) {
  const auth = {
    user: {
      id: 99,
      email: 'teacher@example.com',
      role: 'TEACHER',
      active_tenant_id: 'tenant-1',
    },
    access: 'access-token',
    refresh: 'refresh-token',
    active_tenant_id: 'tenant-1',
    ...overrides,
  }

  localStorage.setItem('auth', JSON.stringify(auth))
}

describe('Auth + ProtectedRoute integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('redirects to login when no auth is stored', async () => {
    renderProtectedRouteApp('/private')

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('allows tenant-protected route when active tenant is authorized', async () => {
    const user = userEvent.setup()
    setStoredAuth()

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/my-tenants/') {
        return Promise.resolve({
          data: {
            active_tenant_id: 'tenant-1',
            tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
          },
        })
      }

      if (url === '/api/v1/courses/active-school-year-status/') {
        return Promise.resolve({
          data: {
            has_active_school_year: true,
            school_year: {
              id: 1,
              label: '2026',
              start_date: '2026-01-01',
              end_date: '2026-12-31',
            },
          },
        })
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    renderProtectedRouteApp('/')

    await user.click(await screen.findByRole('link', { name: 'Go Private' }))

    expect(await screen.findByText('Private Page')).toBeInTheDocument()
    expect(setApiActiveTenantId).toHaveBeenCalledWith('tenant-1')
  })

  it('redirects to home when active tenant is not in authorized tenant catalog', async () => {
    const user = userEvent.setup()
    setStoredAuth({
      user: {
        id: 99,
        email: 'teacher@example.com',
        role: 'TEACHER',
        active_tenant_id: 'tenant-b',
      },
      active_tenant_id: 'tenant-b',
    })

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/my-tenants/') {
        return Promise.resolve({
          data: {
            active_tenant_id: 'tenant-b',
            tenants: [{ tenant_id: 'tenant-a', tenant_name: 'Colegio A' }],
          },
        })
      }

      if (url === '/api/v1/courses/active-school-year-status/') {
        return Promise.resolve({
          data: {
            has_active_school_year: true,
            school_year: {
              id: 1,
              label: '2026',
              start_date: '2026-01-01',
              end_date: '2026-12-31',
            },
          },
        })
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    renderProtectedRouteApp('/')

    await user.click(await screen.findByRole('link', { name: 'Go Private' }))

    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })
})