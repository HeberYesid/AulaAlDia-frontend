import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import * as AuthContext from '../state/AuthContext'

vi.mock('../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}))

vi.mock('../components/ContextualTipBanner', () => ({
  default: () => null,
}))

vi.mock('../components/PublicLayout', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../components/AppTour', () => ({
  default: () => null,
}))

vi.mock('../pages/Dashboard', () => ({
  default: () => <div>Dashboard Mock</div>,
}))

vi.mock('../pages/curriculums/GradeLevels', () => ({
  default: () => <div>GradeLevels Mock</div>,
}))

function renderAppAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

describe('App admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects STUDENT away from /admin/grade-levels', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'STUDENT' },
      loading: false,
    })

    renderAppAt('/admin/grade-levels')

    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
    expect(screen.queryByText('GradeLevels Mock')).not.toBeInTheDocument()
  })

  it('allows ADMIN into /admin/grade-levels', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'ADMIN' },
      loading: false,
    })

    renderAppAt('/admin/grade-levels')

    expect(await screen.findByText('GradeLevels Mock')).toBeInTheDocument()
  })
})
