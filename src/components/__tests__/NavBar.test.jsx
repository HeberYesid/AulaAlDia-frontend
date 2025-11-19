import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBar from '../NavBar'
import { renderWithProviders, mockUser, mockTeacher } from '../../test/utils'
import * as AuthContext from '../../state/AuthContext'

describe('NavBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders logo/brand', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: false
    })
    
    renderWithProviders(<NavBar />)
    
    expect(screen.getByText(/devtrack/i)).toBeInTheDocument()
  })

  it('shows login and register links when not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: false
    })
    
    renderWithProviders(<NavBar />)
    
    expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
    expect(screen.getByText(/registrarse/i)).toBeInTheDocument()
  })

  it('shows user menu when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false
    })
    
    renderWithProviders(<NavBar />)
    
    expect(screen.getByText(new RegExp(mockUser.email, 'i'))).toBeInTheDocument()
  })

  it('shows logout option for authenticated user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false,
      logout: vi.fn()
    })
    
    renderWithProviders(<NavBar />)
    
    expect(screen.getByText(/salir/i)).toBeInTheDocument()
  })

  it('calls logout function when logout is clicked', async () => {
    const user = userEvent.setup()
    const mockLogout = vi.fn()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false,
      logout: mockLogout
    })
    
    renderWithProviders(<NavBar />)
    
    const logoutButton = screen.getByText(/salir/i)
    await user.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('shows navigation links for authenticated users', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacher,
      loading: false
    })
    
    renderWithProviders(<NavBar />)
    
    expect(screen.getByText(/materias/i)).toBeInTheDocument()
    // Check for notification bell by aria-label part
    expect(screen.getByLabelText(/notificaciones/i)).toBeInTheDocument()
  })
})
