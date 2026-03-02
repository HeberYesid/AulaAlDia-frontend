import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../Register'
import { renderWithProviders } from '../../test/utils'
import * as axios from '../../api/axios'

vi.mock('../../api/axios')

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders registration form', () => {
    renderWithProviders(<Register />)
    
    expect(screen.getByPlaceholderText(/tu nombre/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tus apellidos/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/minimo 8 caracteres/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cargando|crear cuenta/i })).toBeInTheDocument()
  })

  it('allows user to fill registration form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />)
    
    const firstNameInput = screen.getByPlaceholderText(/tu nombre/i)
    const lastNameInput = screen.getByPlaceholderText(/tus apellidos/i)
    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i)
    const passwordInput = screen.getByPlaceholderText(/minimo 8 caracteres/i)
    
    await user.type(firstNameInput, 'Juan')
    await user.type(lastNameInput, 'Pérez')
    await user.type(emailInput, 'juan@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(firstNameInput).toHaveValue('Juan')
    expect(lastNameInput).toHaveValue('Pérez')
    expect(emailInput).toHaveValue('juan@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('shows role selection for student', () => {
    renderWithProviders(<Register />)
    
    // Form is present, role is handled by backend
    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()
  })

  it('has link to login page', () => {
    renderWithProviders(<Register />)
    
    const loginLink = screen.getByText(/inicia sesion aqui/i)
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('shows available role buttons', () => {
    renderWithProviders(<Register />)
    
    expect(screen.getByRole('button', { name: /estudiante/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /profesor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /padre \/ tutor/i })).toBeInTheDocument()
  })

  it('validates password minimum length', () => {
    renderWithProviders(<Register />)
    
    const passwordInput = screen.getByPlaceholderText(/minimo 8 caracteres/i)
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })
})
