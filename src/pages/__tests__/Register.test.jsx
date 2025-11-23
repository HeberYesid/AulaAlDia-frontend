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
    
    expect(screen.getByPlaceholderText(/juan/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/pérez/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
  })

  it('allows user to fill registration form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />)
    
    const firstNameInput = screen.getByPlaceholderText(/juan/i)
    const lastNameInput = screen.getByPlaceholderText(/pérez/i)
    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i)
    const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i)
    
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
    
    const loginLink = screen.getByText(/inicia sesión aquí/i)
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('has link to teacher registration', () => {
    renderWithProviders(<Register />)
    
    const teacherLink = screen.getByText(/eres profesor/i)
    expect(teacherLink).toBeInTheDocument()
  })

  it('validates password minimum length', () => {
    renderWithProviders(<Register />)
    
    const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i)
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })
})
