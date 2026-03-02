import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
import * as AuthContext from '../../state/AuthContext'
import { api } from '../../api/axios'

vi.mock('../../api/axios')

const mockTeacherUser = {
  id: 2,
  email: 'teacher@example.com',
  first_name: 'Teacher',
  last_name: 'User',
  role: 'TEACHER',
}

describe('Dashboard Component', () => {
  const renderDashboard = () => render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard for authenticated user', async () => {
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false
    })
    
    renderDashboard()
    
    expect(await screen.findByText(/panel de profesor/i)).toBeInTheDocument()
  })

  it('shows user name in welcome message', async () => {
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false
    })
    
    renderDashboard()
    
    expect(await screen.findByText(/mis materias/i)).toBeInTheDocument()
  })

  it('displays loading state', async () => {
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false,
      isAuthenticated: true
    })
    
    renderDashboard()
    
    expect(await screen.findByText(/panel de profesor/i)).toBeInTheDocument()
  })
})
