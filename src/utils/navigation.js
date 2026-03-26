import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  BarChart2,
  MessageSquare,
  Calendar,
  ClipboardList,
  UserX,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Megaphone,
} from 'lucide-react'
import { USER_ROLES } from './constants'

export const NAVIGATION_SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'academic', label: 'Academico' },
  { id: 'communication', label: 'Comunicacion' },
  { id: 'administration', label: 'Administracion' },
]

const NAVIGATION_ITEMS = [
  {
    key: 'dashboard',
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'general',
    roles: [USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-dashboard',
  },
  {
    key: 'admin-dashboard',
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'general',
    roles: [USER_ROLES.ADMIN],
    tourId: 'nav-admin-dashboard',
  },
  {
    key: 'admin-news',
    to: '/admin/news',
    label: 'Gestion de Novedades',
    icon: Megaphone,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'subjects',
    to: '/subjects',
    label: 'Materias',
    icon: BookOpen,
    section: 'academic',
    roles: [USER_ROLES.TEACHER, USER_ROLES.ADMIN],
    tourId: 'nav-subjects',
  },
  {
    key: 'my-results',
    to: '/my',
    label: (user) => (user.role === USER_ROLES.TUTOR ? 'Progreso' : 'Resultados'),
    icon: BarChart2,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-my',
  },
  {
    key: 'my-subjects',
    to: '/my-subjects',
    label: 'Mis Materias',
    icon: BookMarked,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    showInNavbar: false,
    tourId: 'nav-my-subjects',
  },
  {
    key: 'my-bulletins',
    to: '/my-bulletins',
    label: 'Boletines',
    icon: FileText,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-my-bulletins',
  },
  {
    key: 'messages',
    to: '/messages',
    label: 'Mensajes',
    icon: MessageSquare,
    section: 'communication',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT],
    tourId: 'nav-messages',
  },
  {
    key: 'calendar',
    to: '/calendar',
    label: 'Calendario',
    icon: Calendar,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-calendar',
  },
  {
    key: 'observer',
    to: '/observer',
    label: 'Observador',
    icon: ClipboardList,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    showInNavbar: false,
    tourId: 'nav-observer',
  },
  {
    key: 'absences',
    to: '/absences',
    label: 'Asistencia',
    icon: UserX,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    showInNavbar: false,
    tourId: 'nav-absences',
  },
  {
    key: 'admin-operations',
    to: '/admin/operations',
    label: 'Auditoria',
    icon: ClipboardList,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-users',
    to: '/admin/users',
    label: 'Usuarios',
    icon: Users,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-commercial',
    to: '/admin/commercial',
    label: 'Comercial Tenant',
    icon: ShieldCheck,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    when: (user) => Boolean(user.is_global_admin),
    showInNavbar: false,
    tourId: 'nav-admin-commercial',
  },
  {
    key: 'admin-academic-settings',
    to: '/admin/academic-settings',
    label: 'Config. Academica',
    icon: SlidersHorizontal,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-academic-settings',
  },
  {
    key: 'admin-curriculums',
    to: '/admin/curriculums',
    label: 'Mallas Curriculares',
    icon: BookOpen,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-grade-levels',
    to: '/admin/grade-levels',
    label: 'Grados',
    icon: LayoutDashboard,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-sections',
    to: '/admin/sections',
    label: 'Secciones',
    icon: LayoutDashboard,
    section: 'administration',
    showInNavbar: false,
    roles: [USER_ROLES.ADMIN],
  },
  {
    key: 'admin-courses',
    to: '/admin/courses',
    label: 'Cursos',
    icon: BookOpen,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
]

function canShowItem(item, user) {
  if (!user) return false
  if (item.roles && !item.roles.includes(user.role)) return false
  if (typeof item.when === 'function' && !item.when(user)) return false
  return true
}

function resolveLabel(item, user) {
  if (typeof item.label === 'function') {
    return item.label(user)
  }
  return item.label
}

export function getNavigationItems(user, { surface = 'sidebar' } = {}) {
  const visibilityKey = surface === 'navbar' ? 'showInNavbar' : 'showInSidebar'

  return NAVIGATION_ITEMS
    .filter((item) => canShowItem(item, user))
    .filter((item) => item[visibilityKey] !== false)
    .map((item) => ({ ...item, label: resolveLabel(item, user) }))
}

export function getNavigationSections(user, options = {}) {
  const items = getNavigationItems(user, options)

  return NAVIGATION_SECTIONS
    .map((section) => ({
      ...section,
      items: items.filter((item) => item.section === section.id),
    }))
    .filter((section) => section.items.length > 0)
}
