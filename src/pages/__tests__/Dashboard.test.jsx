import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import Dashboard from '../Dashboard'
import { renderWithProviders, mockUser } from '../../test/utils'
import * as AuthContext from '../../state/AuthContext'

vi.mock('../../api/axios')

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard for authenticated user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false
    })
    
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument()
  })

  it('shows user name in welcome message', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false
    })
    
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(new RegExp(mockUser.first_name, 'i'))).toBeInTheDocument()
  })

  it('displays loading state', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: true
    })
    
    renderWithProviders(<Dashboard />)
    
    // Should show loading indicator
    expect(screen.queryByText(/bienvenido/i)).not.toBeInTheDocument()
  })
})
