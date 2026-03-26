import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import * as AuthContext from '../../state/AuthContext'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state }) => (
      <>
        <div>Redirect:{to}</div>
        <div data-testid="redirect-state">{JSON.stringify(state ?? null)}</div>
      </>
    ),
    useLocation: () => ({ pathname: '/protected' }),
  }
})

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: 'STUDENT',
}

const mockTeacher = {
  id: 2,
  email: 'teacher@example.com',
  role: 'TEACHER',
}

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockUser,
      loading: false
    })
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      user: null,
      loading: false
    })
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    expect(screen.getByText('Redirect:/login')).toBeInTheDocument()
  })

  it('redirects when user does not have required role', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockUser,
      loading: false
    })
    
    render(
      <MemoryRouter>
        <ProtectedRoute roles={['TEACHER']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    expect(screen.getByText('Redirect:/')).toBeInTheDocument()
  })

  it('redirects when required role is passed via allowedRoles alias', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockUser,
      loading: false
    })

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['TEACHER']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Redirect:/')).toBeInTheDocument()
  })

  it('shows loading state while tenant context is still loading', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockTeacher,
      loading: false,
      tenantsLoaded: false,
      tenants: [],
      activeTenantId: null,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireTenant>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByRole('status', { name: /validando institución activa/i })).toBeInTheDocument()
  })

  it('redirects when tenant is required and no active tenant is selected', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockTeacher,
      loading: false,
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      activeTenantId: null,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireTenant>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Redirect:/')).toBeInTheDocument()
    expect(screen.getByTestId('redirect-state')).toHaveTextContent('tenantRequired')
  })

  it('redirects when active tenant is not part of authorized tenant catalog', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockTeacher,
      loading: false,
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      activeTenantId: 'tenant-2',
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireTenant>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Redirect:/')).toBeInTheDocument()
    expect(screen.getByTestId('redirect-state')).toHaveTextContent('tenantDenied')
  })

  it('renders children when tenant is authorized in tenant-required route', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockTeacher,
      loading: false,
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      activeTenantId: 'tenant-1',
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireTenant>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('lets student pass tenant-required route without tenant context', () => {
    AuthContext.useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      activeTenantId: null,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute requireTenant>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
