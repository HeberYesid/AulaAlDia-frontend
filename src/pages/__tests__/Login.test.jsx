import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../Login'
import { renderWithProviders } from '../../test/utils'
import * as axios from '../../api/axios'

vi.mock('../../api/axios')

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tu contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)
    
    // HTML5 validation should prevent submission
    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i)
    expect(emailInput).toBeRequired()
  })

  it('allows user to type email and password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i)
    const passwordInput = screen.getByPlaceholderText(/tu contraseña/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    
    vi.mocked(axios.api.post).mockRejectedValueOnce({
      response: {
        data: { detail: 'Credenciales inválidas' }
      }
    })
    
    renderWithProviders(<Login />)
    
    await user.type(screen.getByPlaceholderText(/tu@email\.com/i), 'wrong@example.com')
    await user.type(screen.getByPlaceholderText(/tu contraseña/i), 'wrongpass123')
    
    // Mock captcha verification
    window.turnstile = {
      render: vi.fn(),
      reset: vi.fn(),
      getResponse: vi.fn(() => 'fake_token')
    }
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      const errorText = screen.queryByText(/credenciales/i) || screen.queryByText(/error/i)
      expect(errorText).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('has link to register page', () => {
    renderWithProviders(<Login />)
    
    const registerLink = screen.getByText(/regístrate aquí/i)
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })
})
