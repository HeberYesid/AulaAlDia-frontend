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
    
    expect(screen.getByLabelText(/nombres/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apellidos/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
  })

  it('allows user to fill registration form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />)
    
    await user.type(screen.getByLabelText(/nombres/i), 'Juan')
    await user.type(screen.getByLabelText(/apellidos/i), 'Pérez')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    
    expect(screen.getByLabelText(/nombres/i)).toHaveValue('Juan')
    expect(screen.getByLabelText(/apellidos/i)).toHaveValue('Pérez')
    expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('juan@example.com')
    expect(screen.getByLabelText(/contraseña/i)).toHaveValue('password123')
  })

  it('shows role selection for student', () => {
    renderWithProviders(<Register />)
    
    const roleSelect = screen.getByLabelText(/rol/i)
    expect(roleSelect).toBeInTheDocument()
    expect(roleSelect).toHaveValue('STUDENT')
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
    
    const passwordInput = screen.getByLabelText(/contraseña/i)
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })
})
