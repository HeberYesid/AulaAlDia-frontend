import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import { useAuth } from '../../state/AuthContext'
import * as axios from '../../api/axios'

const mockNavigate = vi.fn()

const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

vi.mock('../../api/axios', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
    setApiActiveTenantId: vi.fn(),
  }
})
vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <div>
      <button type="button" onClick={() => onSuccess?.({ credential: 'fake-credential' })}>
        Google Login Mock
      </button>
      <button type="button" onClick={() => onError?.()}>
        Google Error Mock
      </button>
    </div>
  ),
}))

describe('Login Component', () => {
  const renderLogin = () => render(
    <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
      <Login />
    </MemoryRouter>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockNavigate.mockReset()
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id')
    useAuth.mockReturnValue({
      login: vi.fn(),
      googleLogin: vi.fn(),
      user: null,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders login form', () => {
    renderLogin()
    
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitButton)
    
    // HTML5 validation should prevent submission
    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i)
    expect(emailInput).toBeRequired()
  })

  it('allows user to type email and password', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const emailInput = screen.getByPlaceholderText(/tu@email\.com/i)
    const passwordInput = screen.getByPlaceholderText(/••••••••/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockRejectedValueOnce({
      response: {
        data: { detail: 'Credenciales inválidas' }
      }
    })
    useAuth.mockReturnValue({
      login: mockLogin,
      googleLogin: vi.fn(),
      user: null,
    })
    renderLogin()
    
    await user.type(screen.getByPlaceholderText(/tu@email\.com/i), 'wrong@example.com')
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpass123')
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      const errorText = screen.queryByText(/credenciales/i) || screen.queryByText(/error/i)
      expect(errorText).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('submits the form when pressing Enter in the password field', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockResolvedValueOnce()
    useAuth.mockReturnValue({
      login: mockLogin,
      googleLogin: vi.fn(),
      user: null,
    })

    renderLogin()

    await user.type(screen.getByPlaceholderText(/tu@email\.com/i), 'test@example.com')
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'password123{enter}')

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('hides the submit button during login lockout and restores it afterwards', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Has superado el máximo de 3 intentos fallidos. Intenta de nuevo en 5 minuto(s).',
          retry_after: 1,
        },
      },
    })

    useAuth.mockReturnValue({
      login: mockLogin,
      googleLogin: vi.fn(),
      user: null,
    })

    renderLogin()

    await user.type(screen.getByPlaceholderText(/tu@email\.com/i), 'test@example.com')
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/••••••••/i), '{enter}')
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/podras intentar de nuevo en 1s\.|podrás intentar de nuevo en 1s\./i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('has link to register page', () => {
    renderLogin()
    
    const registerLink = screen.getByText(/regístrate aquí/i)
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('hides Google login when client ID is missing', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    renderLogin()

    expect(screen.queryByRole('button', { name: /google login mock/i })).not.toBeInTheDocument()
  })

  it('preserves tenant_id from the URL', () => {
    render(
      <MemoryRouter
        initialEntries={['/login?tenant_id=22222222-2222-2222-2222-222222222222']}
        future={ROUTER_FUTURE_FLAGS}
      >
        <Login />
      </MemoryRouter>
    )

    expect(axios.setApiActiveTenantId).toHaveBeenCalledWith('22222222-2222-2222-2222-222222222222')

    const registerLink = screen.getByText(/regístrate aquí/i)
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register?tenant_id=22222222-2222-2222-2222-222222222222')
  })

  it('preserves tenant_id when redirecting new Google users to complete registration', async () => {
    const user = userEvent.setup()
    const mockGoogleLogin = vi.fn().mockResolvedValueOnce({ is_new_user: true })
    useAuth.mockReturnValue({
      login: vi.fn(),
      googleLogin: mockGoogleLogin,
      user: null,
    })

    render(
      <MemoryRouter
        initialEntries={['/login?tenant_id=22222222-2222-2222-2222-222222222222']}
        future={ROUTER_FUTURE_FLAGS}
      >
        <Login />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /google login mock/i }))

    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalledWith('fake-credential')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/complete-registration?tenant_id=22222222-2222-2222-2222-222222222222')
  })
})
