import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../state/AuthContext'

/**
 * Custom render function that includes common providers
 */
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Mock user object
 */
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  username: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'STUDENT',
  is_email_verified: true
}

/**
 * Mock teacher user
 */
export const mockTeacher = {
  id: 2,
  email: 'teacher@example.com',
  username: 'teacher@example.com',
  first_name: 'Teacher',
  last_name: 'User',
  role: 'TEACHER',
  is_email_verified: true
}
