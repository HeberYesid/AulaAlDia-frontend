import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserProfile from '../UserProfile'
import { renderWithProviders } from '../../test/utils'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  }
}))

vi.mock('../../components/AppTour', () => ({
  resetTour: vi.fn()
}))

vi.mock('../../utils/toast', () => ({
  showPasswordChangeToast: vi.fn()
}))

describe('UserProfile Component', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'STUDENT',
    session_timeout: 30
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: mockUser })
  })

  it('renders user profile information', async () => {
    renderWithProviders(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  it('allows updating profile information', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserProfile />)
    
    // Wait for load
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument())
    
    // Enable editing
    await user.click(screen.getByRole('button', { name: /^Editar$/i }))
    
    // Change name
    const nameInput = screen.getByLabelText(/Nombre/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')
    
    // Save
    api.patch.mockResolvedValueOnce({ 
      data: { ...mockUser, first_name: 'Updated Name' } 
    })
    
    await user.click(screen.getByText(/guardar cambios/i))
    
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/auth/profile/', {
        first_name: 'Updated Name',
        last_name: 'User'
      })
      expect(screen.getByText(/perfil actualizado correctamente/i)).toBeInTheDocument()
    })
  })

  it('validates password matching during change', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserProfile />)
    
    await waitFor(() => expect(screen.queryByText(/cargando perfil/i)).not.toBeInTheDocument())
    
    // Open password form
    await user.click(screen.getByRole('button', { name: /^Cambiar$/i }))
    
    // Type mismatched passwords
    const newPassInput = screen.getByLabelText(/^Nueva Contraseña$/i)
    const confirmPassInput = screen.getByLabelText(/^Confirmar Nueva Contraseña$/i)
    const currentPassInput = screen.getByLabelText(/Contraseña Actual/i)
    
    await user.type(currentPassInput, 'oldpass')
    await user.type(newPassInput, 'newpass123')
    await user.type(confirmPassInput, 'mismatch')
    
    // Submit
    await user.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }))
    
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})
