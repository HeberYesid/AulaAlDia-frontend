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
  LifeBuoy,
} from 'lucide-react'
import { USER_ROLES } from './constants'

export const NAVIGATION_SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'administration', label: 'Administracion' },
  { id: 'academic', label: 'Academico' },
  { id: 'communication', label: 'Comunicacion' },
]

const NAVIGATION_ITEMS = [
  {
    key: 'dashboard',
    to: '/',
    label: 'Dashboard',
    contextualTip: 'Revisa aqui el resumen rapido de tu actividad y entra a los modulos clave desde el menu lateral.',
    icon: LayoutDashboard,
    section: 'general',
    roles: [USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-dashboard',
  },
  {
    key: 'admin-dashboard',
    to: '/admin/dashboard',
    label: 'Dashboard',
    contextualTip: 'Monitorea los indicadores principales y usa este panel para priorizar acciones academicas y operativas.',
    icon: LayoutDashboard,
    section: 'general',
    roles: [USER_ROLES.ADMIN],
    tourId: 'nav-admin-dashboard',
  },
  {
    key: 'admin-news',
    to: '/admin/news',
    label: 'Gestion de Novedades',
    contextualTip: 'Publica novedades claras y breves para mantener informada a toda la comunidad en tiempo real.',
    icon: Megaphone,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-support',
    to: '/admin/support',
    label: 'Atencion al Cliente',
    contextualTip: 'Crea tickets para contactar soporte tecnico y consulta el estado de cada solicitud institucional.',
    icon: LifeBuoy,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-support',
  },
  {
    key: 'admin-bulletins',
    to: '/admin/bulletins',
    label: 'Boletines',
    contextualTip: 'Consulta y gestiona boletines academicos del conjunto institucional.',
    icon: FileText,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-bulletins',
  },
  {
    key: 'subjects',
    to: '/subjects',
    label: 'Materias',
    contextualTip: 'Para crear una materia, usa el boton de crear en esta vista y completa nombre, grado y seccion.',
    icon: BookOpen,
    section: 'academic',
    roles: [USER_ROLES.TEACHER, USER_ROLES.ADMIN],
    tourId: 'nav-subjects',
  },
  {
    key: 'my-results',
    to: '/my',
    label: (user) => (user.role === USER_ROLES.TUTOR ? 'Progreso' : 'Resultados'),
    contextualTip: 'Consulta aqui el rendimiento por actividad para identificar avances y puntos de mejora.',
    icon: BarChart2,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-my',
  },
  {
    key: 'my-subjects',
    to: '/my-subjects',
    label: 'Mis Materias',
    contextualTip: 'Entra a cada materia para revisar contenidos, ejercicios y seguimiento academico detallado.',
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
    contextualTip: 'Genera y revisa tus boletines para tener una vista consolidada del periodo academico.',
    icon: FileText,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-my-bulletins',
  },
  {
    key: 'messages',
    to: '/messages',
    label: 'Mensajes',
    contextualTip: 'Usa este modulo para comunicarte de forma directa y mantener contexto por conversacion.',
    icon: MessageSquare,
    section: 'communication',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT],
    tourId: 'nav-messages',
  },
  {
    key: 'calendar',
    to: '/calendar',
    label: 'Calendario',
    contextualTip: 'Planifica entregas y eventos clave; revisa fechas proximas para evitar retrasos.',
    icon: Calendar,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-calendar',
  },
  {
    key: 'observer',
    to: '/observer',
    label: 'Observador',
    contextualTip: 'Registra observaciones relevantes y consulta historial para seguimiento academico oportuno.',
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
    contextualTip: 'Controla faltas y justificaciones desde aqui para mantener el estado de asistencia actualizado.',
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
    contextualTip: 'Revisa eventos operativos para auditar cambios y validar trazabilidad institucional.',
    icon: ClipboardList,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-users',
    to: '/admin/users',
    label: 'Usuarios',
    contextualTip: 'Administra usuarios, roles y accesos para mantener orden y seguridad en la plataforma.',
    icon: Users,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-commercial',
    to: '/admin/commercial',
    label: 'Comercial Institucional',
    contextualTip: 'Gestiona informacion comercial multiinstitución para el seguimiento de planes y facturacion.',
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
    contextualTip: 'Ajusta periodos y parametros academicos base para que toda la operacion use la misma regla.',
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
    contextualTip: 'Define y organiza las mallas curriculares para estructurar contenidos por nivel y grado.',
    icon: BookOpen,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-grade-levels',
    to: '/admin/grade-levels',
    label: 'Grados',
    contextualTip: 'Configura los grados academicos para mantener coherencia en la estructura institucional.',
    icon: LayoutDashboard,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
  {
    key: 'admin-sections',
    to: '/admin/sections',
    label: 'Secciones',
    contextualTip: 'Crea secciones por grado para organizar grupos y facilitar la asignacion de materias.',
    icon: LayoutDashboard,
    section: 'administration',
    showInNavbar: false,
    roles: [USER_ROLES.ADMIN],
  },
  {
    key: 'admin-courses',
    to: '/admin/courses',
    label: 'Cursos',
    contextualTip: 'Administra cursos y su relacion con grados y secciones para mantener una oferta ordenada.',
    icon: BookOpen,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
  },
]

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

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

export function getContextualTipByPath(user, pathname, options = {}) {
  if (!user) return null

  const normalizedPath = normalizePath(pathname)
  const items = getNavigationItems(user, { surface: 'sidebar', ...options })
  const matchedItem = items.find((item) => normalizePath(item.to) === normalizedPath)

  return matchedItem?.contextualTip || null
}
