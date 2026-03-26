import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ContextualTipBanner from '../ContextualTipBanner'
import * as AuthContext from '../../state/AuthContext'

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('ContextualTipBanner component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an info tip for a supported sidebar route', () => {
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: 2,
        first_name: 'Teacher',
        role: 'TEACHER',
      },
    })

    render(
      <MemoryRouter initialEntries={['/subjects']}>
        <ContextualTipBanner />
      </MemoryRouter>
    )

    expect(screen.getByRole('status')).toHaveTextContent(/crear una materia/i)
  })

  it('does not render a tip on detail subroutes', () => {
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: 2,
        first_name: 'Teacher',
        role: 'TEACHER',
      },
    })

    render(
      <MemoryRouter initialEntries={['/subjects/99']}>
        <ContextualTipBanner />
      </MemoryRouter>
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('does not render for anonymous users', () => {
    AuthContext.useAuth.mockReturnValue({ user: null })

    render(
      <MemoryRouter initialEntries={['/subjects']}>
        <ContextualTipBanner />
      </MemoryRouter>
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})