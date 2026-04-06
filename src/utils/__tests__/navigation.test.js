import { describe, it, expect } from 'vitest'
import { getNavigationItems, getNavigationSections, getContextualTipByPath } from '../navigation'
import { USER_ROLES } from '../constants'

function buildUser(role, overrides = {}) {
  return {
    id: 1,
    first_name: 'Test',
    role,
    is_global_admin: false,
    ...overrides,
  }
}

describe('navigation config', () => {
  it('hides messages for tutor role', () => {
    const tutor = buildUser(USER_ROLES.TUTOR)

    const sidebarItems = getNavigationItems(tutor, { surface: 'sidebar' })
    const keys = sidebarItems.map((item) => item.key)

    expect(keys).not.toContain('messages')
    expect(keys).toContain('my-results')
    expect(keys).not.toContain('teacher-evaluations-student')
  })

  it('shows admin dashboard and admin-only items for admin', () => {
    const admin = buildUser(USER_ROLES.ADMIN)

    const sidebarItems = getNavigationItems(admin, { surface: 'sidebar' })
    const keys = sidebarItems.map((item) => item.key)

    expect(keys).toContain('admin-dashboard')
    expect(keys).toContain('admin-users')
    expect(keys).toContain('admin-bulletins')
    expect(keys).toContain('admin-teacher-attendance')
    expect(keys).not.toContain('dashboard')
  })

  it('only shows commercial admin item for global admin', () => {
    const tenantAdmin = buildUser(USER_ROLES.ADMIN, { is_global_admin: false })
    const globalAdmin = buildUser(USER_ROLES.ADMIN, { is_global_admin: true })

    const tenantKeys = getNavigationItems(tenantAdmin, { surface: 'sidebar' }).map((item) => item.key)
    const globalKeys = getNavigationItems(globalAdmin, { surface: 'sidebar' }).map((item) => item.key)

    expect(tenantKeys).not.toContain('admin-commercial')
    expect(globalKeys).toContain('admin-commercial')
  })

  it('resolves role-specific labels correctly', () => {
    const student = buildUser(USER_ROLES.STUDENT)
    const tutor = buildUser(USER_ROLES.TUTOR)

    const studentMyItem = getNavigationItems(student, { surface: 'sidebar' }).find((item) => item.key === 'my-results')
    const tutorMyItem = getNavigationItems(tutor, { surface: 'sidebar' }).find((item) => item.key === 'my-results')

    expect(studentMyItem?.label).toBe('Resultados')
    expect(tutorMyItem?.label).toBe('Progreso')
  })

  it('shows teacher evaluation entry only for student, teacher and admin', () => {
    const student = buildUser(USER_ROLES.STUDENT)
    const teacher = buildUser(USER_ROLES.TEACHER)
    const admin = buildUser(USER_ROLES.ADMIN)
    const tutor = buildUser(USER_ROLES.TUTOR)

    const studentKeys = getNavigationItems(student, { surface: 'sidebar' }).map((item) => item.key)
    const teacherKeys = getNavigationItems(teacher, { surface: 'sidebar' }).map((item) => item.key)
    const adminKeys = getNavigationItems(admin, { surface: 'sidebar' }).map((item) => item.key)
    const tutorKeys = getNavigationItems(tutor, { surface: 'sidebar' }).map((item) => item.key)

    expect(studentKeys).toContain('teacher-evaluations-student')
    expect(teacherKeys).toContain('teacher-evaluations-staff')
    expect(adminKeys).toContain('teacher-evaluations-staff')
    expect(tutorKeys).not.toContain('teacher-evaluations-student')
    expect(tutorKeys).not.toContain('teacher-evaluations-staff')
  })

  it('groups sidebar items by sections', () => {
    const teacher = buildUser(USER_ROLES.TEACHER)

    const sections = getNavigationSections(teacher, { surface: 'sidebar' })
    const sectionIds = sections.map((section) => section.id)

    expect(sectionIds).toContain('general')
    expect(sectionIds).toContain('academic')
    expect(sectionIds).toContain('communication')
    expect(sectionIds).not.toContain('administration')
  })

  it('orders admin sidebar sections as configured', () => {
    const admin = buildUser(USER_ROLES.ADMIN)

    const sectionIds = getNavigationSections(admin, { surface: 'sidebar' }).map((section) => section.id)

    expect(sectionIds).toEqual(['general', 'administration', 'academic', 'communication'])
  })

  it('keeps navbar focused and hides low-priority links', () => {
    const student = buildUser(USER_ROLES.STUDENT)

    const navbarKeys = getNavigationItems(student, { surface: 'navbar' }).map((item) => item.key)

    expect(navbarKeys).toContain('messages')
    expect(navbarKeys).toContain('calendar')
    expect(navbarKeys).not.toContain('observer')
    expect(navbarKeys).not.toContain('absences')
  })

  it('resolves contextual tip for exact sidebar route', () => {
    const teacher = buildUser(USER_ROLES.TEACHER)

    const tip = getContextualTipByPath(teacher, '/subjects')

    expect(tip).toMatch(/crear una materia/i)
  })

  it('does not resolve contextual tip for subroute detail path', () => {
    const teacher = buildUser(USER_ROLES.TEACHER)

    const tip = getContextualTipByPath(teacher, '/subjects/123')

    expect(tip).toBeNull()
  })
})
