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
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/profile/') {
        return Promise.resolve({ data: mockUser })
      }

      if (url === '/api/v1/auth/student-tutor-invitation/') {
        return Promise.resolve({
          data: {
            has_tutor: false,
            tutor: null,
            pending_invitation: null,
          },
        })
      }

      return Promise.reject(new Error(`Unhandled GET ${url}`))
    })
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

  it('allows a student to invite a caregiver', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({
      data: { message: 'Invitacion enviada correctamente al acudiente.' },
    })

    renderWithProviders(<UserProfile />)

    await waitFor(() => expect(screen.getByText('Invitar Acudiente')).toBeInTheDocument())

    await user.type(screen.getByLabelText(/correo del acudiente/i), 'caregiver@example.com')
    await user.click(screen.getByRole('button', { name: /enviar invitacion/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/student-tutor-invitation/', {
        email: 'caregiver@example.com',
      })
    })
  })
})
