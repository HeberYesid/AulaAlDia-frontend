import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import * as AuthContext from '../../state/AuthContext'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }) => <div>Redirect:{to}</div>,
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
})
