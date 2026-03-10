import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../Register'
import { renderWithProviders } from '../../test/utils'
import * as axios from '../../api/axios'

vi.mock('../../api/axios')

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.history.pushState({}, '', '/register')
  })

  it('shows only institution guidance without tenant_id', () => {
    renderWithProviders(<Register />)

    expect(screen.getByText(/debes ingresar desde el enlace de registro compartido por tu institución/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/tu nombre/i)).not.toBeInTheDocument()
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })

  it('shows that public registration is only for students when tenant_id is present', () => {
    window.history.pushState({}, '', `/register?tenant_id=${TENANT_ID}`)

    renderWithProviders(<Register />)

    expect(screen.getByText(/registro publico esta disponible solo para estudiantes/i)).toBeInTheDocument()
  })

  it('renders registration form when tenant_id is present', () => {
    window.history.pushState({}, '', `/register?tenant_id=${TENANT_ID}`)

    renderWithProviders(<Register />)

    expect(screen.getByPlaceholderText(/tu nombre/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tus apellidos/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/minimo 8 caracteres/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cargando|crear cuenta/i })).toBeInTheDocument()
  })

  it('does not render teacher or caregiver role buttons', () => {
    renderWithProviders(<Register />)

    expect(screen.queryByRole('button', { name: /profesor/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /acudiente/i })).not.toBeInTheDocument()
  })

  it('captures tenant_id from query string', () => {
    window.history.pushState({}, '', `/register?tenant_id=${TENANT_ID}`)

    renderWithProviders(<Register />)

    expect(axios.setApiActiveTenantId).toHaveBeenCalledWith(TENANT_ID)
  })

  it('allows user to fill registration form', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', `/register?tenant_id=${TENANT_ID}`)

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

  it('shows form for student registration only when tenant_id is present', () => {
    window.history.pushState({}, '', `/register?tenant_id=${TENANT_ID}`)

    renderWithProviders(<Register />)

    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()
  })

  it('has link to login page', () => {
    renderWithProviders(<Register />)
    
    const loginLink = screen.getByText(/inicia sesion aqui/i)
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('does not show public role selection buttons', () => {
    renderWithProviders(<Register />)

    expect(screen.queryByRole('button', { name: /estudiante/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /profesor/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /acudiente/i })).not.toBeInTheDocument()
  })

  it('validates password minimum length', () => {
    window.history.pushState({}, '', `/register?tenant_id=${TENANT_ID}`)

    renderWithProviders(<Register />)
    
    const passwordInput = screen.getByPlaceholderText(/minimo 8 caracteres/i)
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })

  it('keeps the form hidden even if an active tenant exists without tenant_id in the URL', () => {
    localStorage.setItem('activeTenantId', TENANT_ID)

    renderWithProviders(<Register />)

    expect(screen.getByText(/debes ingresar desde el enlace de registro compartido por tu institución/i)).toBeInTheDocument()
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })
})
