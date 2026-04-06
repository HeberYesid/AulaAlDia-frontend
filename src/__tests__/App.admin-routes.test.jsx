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

vi.mock('../pages/AdminBulletins', () => ({
  default: () => <div>AdminBulletins Mock</div>,
}))

vi.mock('../pages/TeacherEvaluations', () => ({
  default: () => <div>TeacherEvaluations Mock</div>,
}))

vi.mock('../pages/AdminTeacherAttendance', () => ({
  default: () => <div>AdminTeacherAttendance Mock</div>,
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

  it('renders dashboard at root path / for authenticated users', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'TEACHER' },
      loading: false,
      tenantsLoaded: true,
      activeTenantId: 'tenant-1',
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
    })

    renderAppAt('/')

    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
  })

  it('renders dashboard at /dashboard for authenticated users', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'TEACHER' },
      loading: false,
      tenantsLoaded: true,
      activeTenantId: 'tenant-1',
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
    })

    renderAppAt('/dashboard')

    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
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

  it('redirects STUDENT away from /admin/bulletins', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'STUDENT' },
      loading: false,
    })

    renderAppAt('/admin/bulletins')

    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
    expect(screen.queryByText('AdminBulletins Mock')).not.toBeInTheDocument()
  })

  it('allows ADMIN into /admin/bulletins', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'ADMIN' },
      loading: false,
    })

    renderAppAt('/admin/bulletins')

    expect(await screen.findByText('AdminBulletins Mock')).toBeInTheDocument()
  })

  it('allows STUDENT into /teacher-evaluations', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'STUDENT' },
      loading: false,
      tenantsLoaded: true,
      activeTenantId: 'tenant-1',
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      schoolYearGateLoaded: true,
      hasActiveSchoolYear: true,
      activeSchoolYear: { id: 1, label: '2026' },
    })

    renderAppAt('/teacher-evaluations')

    expect(await screen.findByText('TeacherEvaluations Mock')).toBeInTheDocument()
  })

  it('redirects TUTOR away from /teacher-evaluations', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'TUTOR' },
      loading: false,
      tenantsLoaded: true,
      activeTenantId: 'tenant-1',
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      schoolYearGateLoaded: true,
      hasActiveSchoolYear: true,
      activeSchoolYear: { id: 1, label: '2026' },
    })

    renderAppAt('/teacher-evaluations')

    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
    expect(screen.queryByText('TeacherEvaluations Mock')).not.toBeInTheDocument()
  })

  it('allows ADMIN into /admin/teacher-attendance', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'ADMIN' },
      loading: false,
      tenantsLoaded: true,
      activeTenantId: 'tenant-1',
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      schoolYearGateLoaded: true,
      hasActiveSchoolYear: true,
      activeSchoolYear: { id: 1, label: '2026' },
    })

    renderAppAt('/admin/teacher-attendance')

    expect(await screen.findByText('AdminTeacherAttendance Mock')).toBeInTheDocument()
  })

  it('redirects TEACHER away from /admin/teacher-attendance', async () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, role: 'TEACHER' },
      loading: false,
      tenantsLoaded: true,
      activeTenantId: 'tenant-1',
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      schoolYearGateLoaded: true,
      hasActiveSchoolYear: true,
      activeSchoolYear: { id: 1, label: '2026' },
    })

    renderAppAt('/admin/teacher-attendance')

    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
    expect(screen.queryByText('AdminTeacherAttendance Mock')).not.toBeInTheDocument()
  })
})
