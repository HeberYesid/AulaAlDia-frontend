import {
  Home,
  Gauge,
  Megaphone,
  LifeBuoy,
  FileText,
  Clock3,
  History,
  BookOpenText,
  BarChart3,
  Bookmark,
  GraduationCap,
  ClipboardCheck,
  ScrollText,
  MessageCircleMore,
  CalendarDays,
  NotebookPen,
  UserMinus,
  FileSearch,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Route,
  School,
  Rows3,
  Package,
  CalendarClock,
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
    contextualTip: 'Tu panel de actividad diaria: revisa el resumen, detecta alertas y accede rapido a los modulos que mas usas.',
    icon: Home,
    section: 'general',
    roles: [USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-dashboard',
    onboarding: {
      internalTarget: '.welcome-panel',
      internalDescription: 'Aquí comienza el flujo diario: revisa el resumen, detecta alertas y decide a qué módulo entrar primero.',
    },
  },
  {
    key: 'admin-dashboard',
    to: '/admin/dashboard',
    label: 'Dashboard',
    contextualTip: 'Panel de control con indicadores operativos para priorizar incidencias, seguimiento academico y configuracion.',
    icon: Gauge,
    section: 'general',
    roles: [USER_ROLES.ADMIN],
    tourId: 'nav-admin-dashboard',
    onboarding: {
      internalTarget: '.dashboard-header',
      internalDescription: 'Este panel concentra indicadores operativos para que priorices incidencias, seguimiento académico y configuración.',
    },
  },
  {
    key: 'admin-news',
    to: '/admin/news',
    label: 'Novedades',
    contextualTip: 'Publica y gestiona comunicaciones institucionales para mantener informada a toda tu comunidad.',
    icon: Megaphone,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-news',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Novedades te permite publicar comunicaciones institucionales y controlar su audiencia.',
    },
  },
  {
    key: 'admin-support',
    to: '/admin/support',
    label: 'Atencion al Cliente',
    contextualTip: 'Crea y haz seguimiento a tickets de soporte tecnico para resolver incidencias de tu institucion.',
    icon: LifeBuoy,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-support',
      onboarding: {
        internalTarget: '.support-tickets__form',
        internalDescription: 'En este módulo aprenderás a crear un ticket.',
        taskDescription: 'Haz esto: revisa el formulario, escribe un asunto y un detalle para entender cómo se solicita soporte desde este módulo.',
      },
  },

  {
    key: 'admin-teacher-attendance',
    to: '/admin/teacher-attendance',
    label: 'Asistencia Docente',
    contextualTip: 'Supervisa entradas y salidas del equipo docente para detectar novedades operativas a tiempo.',
    icon: Clock3,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-teacher-attendance',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Asistencia Docente centraliza la supervisión diaria de entradas, salidas y novedades del equipo.',
    },
  },
    {
    key: 'admin-operations',
    to: '/admin/operations',
    label: 'Auditoria',
    contextualTip: 'Revisa el historial de eventos operativos para auditar cambios y validar la trazabilidad institucional.',
    icon: FileSearch,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-operations',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Auditoría te muestra trazabilidad operacional para revisar cambios y eventos relevantes.',
    },
  },
    {
    key: 'admin-users',
    to: '/admin/users',
    label: 'Usuarios',
    contextualTip: 'Administra usuarios, roles y permisos para mantener el orden y la seguridad en la plataforma.',
    icon: Users,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-users',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Usuarios del colegio concentra altas, roles y control de acceso por institución.',
    },
  },
    {
    key: 'admin-academic-settings',
    to: '/admin/academic-settings',
    label: 'Config. Academica',
    contextualTip: 'Define periodos, años y reglas academicas base para que toda la operacion funcione con los mismos parametros.',
    icon: SlidersHorizontal,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-academic-settings',
    onboarding: {
      internalTarget: '.table-container',
      internalDescription: 'Configuración académica define años, periodos y reglas base que afectan toda la operación.',
    },
  },
    {
    key: 'admin-bulletins',
    to: '/admin/bulletins',
    label: 'Boletines',
    contextualTip: 'Consulta y gestiona los boletines academicos de toda la institucion en un solo lugar.',
    icon: FileText,
    section: 'academic',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-bulletins',
    onboarding: {
      internalTarget: '.admin-bulletins__header-title',
      internalDescription: 'Boletines institucionales consolida emisión, consulta y seguimiento formal por estudiante y periodo.',
    },
  },
  {
    key: 'subjects',
    to: '/subjects',
    label: 'Materias',
    contextualTip: 'Gestiona tus materias: crea contenidos, ejercicios y haz seguimiento del progreso de tus estudiantes.',
    icon: BookOpenText,
    section: 'academic',
    roles: [USER_ROLES.TEACHER, USER_ROLES.ADMIN],
    tourId: 'nav-subjects',
    onboarding: {
      internalTarget: '.data-table',
      internalDescription: 'Aquí gestionas la operación académica por materia: estudiantes, ejercicios, resultados y seguimiento.',
    },
  },
  { 
    key: 'teacher-evaluations-staff',
    to: '/teacher-evaluations',
    label: 'Eval. Docente',
    contextualTip: 'Consulta los resultados de evaluacion docente de forma anonima y agregada por materia.',
    icon: ClipboardCheck,
    section: 'academic',
    roles: [USER_ROLES.TEACHER, USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-teacher-evaluations',
  },
  
  {
    key: 'my-results',
    to: '/my',
    label: (user) => (user.role === USER_ROLES.TUTOR ? 'Progreso' : 'Resultados'),
    contextualTip: 'Consulta tu rendimiento por actividad para identificar fortalezas y areas de mejora.',
    icon: BarChart3,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-my',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Este módulo te ayuda a leer el rendimiento consolidado y detectar rápidamente fortalezas y alertas.',
    },
  },
    {
    key: 'calendar',
    to: '/calendar',
    label: 'Calendario',
    contextualTip: 'Planifica entregas, eventos y fechas clave en un calendario centralizado con filtros por materia.',
    icon: CalendarDays,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-calendar',
    onboarding: {
      internalTarget: '.calendar-page',
      internalDescription: 'Calendario centraliza eventos y filtros por materia para planificar entregas y hitos institucionales.',
    },
  },
    {
    key: 'schedules',
    to: '/schedules',
    label: 'Horarios',
    contextualTip: 'Consulta tus horarios en formato semanal o diario segun tu rol dentro de la institucion.',
    icon: CalendarClock,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-schedules',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Horarios te permite entender la distribución semanal de clases y disponibilidad según el rol.',
    },
  },
    {
    key: 'observer',
    to: '/observer',
    label: 'Observador',
    contextualTip: 'Registra observaciones academicas y de convivencia, y consulta el historial de seguimiento.',
    icon: NotebookPen,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    showInNavbar: false,
    tourId: 'nav-observer',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Observador reúne observaciones académicas y convivenciales para hacer seguimiento más fino.',
    },
  },
  
  {
    key: 'absences',
    to: '/absences',
    label: 'Asistencia',
    contextualTip: 'Controla faltas, justificaciones y manten actualizado el estado de asistencia de cada estudiante.',
    icon: UserMinus,
    section: 'academic',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    showInNavbar: false,
    tourId: 'nav-absences',
    onboarding: {
      internalTarget: '.absences__filters-card',
      internalDescription: 'Asistencia combina filtros, registro y consulta del estado de faltas y justificaciones.',
    },
  },
    {
    key: 'admin-curriculums',
    to: '/admin/curriculums',
    label: 'Mallas Curriculares',
    contextualTip: 'Define y organiza las mallas curriculares que estructuran los contenidos por nivel y grado.',
    icon: Route,
    section: 'academic',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-curriculums',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Mallas Curriculares define la estructura académica que luego consumen grados, cursos y materias.',
    },
  },
    ///////////////////////////////

  {
    key: 'my-subjects',
    to: '/my-subjects',
    label: 'Mis Materias',
    contextualTip: 'Entra a cada materia para revisar contenidos, ejercicios y hacer seguimiento detallado de tu progreso.',
    icon: Bookmark,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    showInNavbar: false,
    tourId: 'nav-my-subjects',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Desde aquí entras al detalle de cada asignatura para entender contenidos, progreso y tareas.',
    },
  },
  {
    key: 'teacher-evaluations-student',
    to: '/teacher-evaluations',
    label: 'Eval. Docente',
    contextualTip: 'Evalua a tus docentes por materia activa. Tus respuestas son anonimas y se muestran de forma agregada.',
    icon: GraduationCap,
    section: 'academic',
    roles: [USER_ROLES.STUDENT],
    showInNavbar: false,
    tourId: 'nav-teacher-evaluations',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Aquí se consulta o diligencia la evaluación docente según el rol, siempre con enfoque por materia activa.',
    },
  },
  
  {
    key: 'my-bulletins',
    to: '/my-bulletins',
    label: 'Boletines',
    contextualTip: 'Genera y revisa tus boletines para tener una vista consolidada de tu rendimiento en el periodo.',
    icon: ScrollText,
    section: 'academic',
    roles: [USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-my-bulletins',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'En Boletines revisas el consolidado formal del periodo para seguimiento académico y familiar.',
    },
  },





  {
    key: 'teacher-attendance-history',
    to: '/teacher-attendance/history',
    label: 'Historial de Asistencia',
    contextualTip: 'Consulta tu historial de entradas y salidas para validar tu trazabilidad de asistencia diaria.',
    icon: History,
    section: 'academic',
    roles: [USER_ROLES.TEACHER],
    showInNavbar: false,
    tourId: 'nav-teacher-attendance-history',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Aquí el docente revisa su propio historial de asistencia con filtros y trazabilidad temporal.',
    },
  },

  {
    key: 'admin-commercial',
    to: '/admin/commercial',
    label: 'Comercial Institucional',
    contextualTip: 'Gestiona la informacion comercial multiinstitucion: planes, facturacion y seguimiento de cuentas.',
    icon: ShieldCheck,
    section: 'administration',
    roles: [USER_ROLES.ADMIN],
    when: (user) => Boolean(user.is_global_admin),
    showInNavbar: false,
    tourId: 'nav-admin-commercial',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Este módulo consolida la operación comercial multiinstitución para administradores globales.',
    },
  },


  {
    key: 'admin-grade-levels',
    to: '/admin/grade-levels',
    label: 'Grados',
    contextualTip: 'Configura los grados academicos para mantener la estructura base sobre la que opera tu institucion.',
    icon: School,
    section: 'academic',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-grade-levels',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Grados te ayuda a organizar la estructura académica base sobre la que opera la institución.',
    },
  },
  {
    key: 'admin-sections',
    to: '/admin/sections',
    label: 'Secciones',
    contextualTip: 'Organiza grupos por grado para ordenar la matricula, los horarios y la asignacion de materias.',
    icon: Rows3,
    section: 'academic',
    showInNavbar: false,
    roles: [USER_ROLES.ADMIN],
    tourId: 'nav-admin-sections',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Secciones separa grupos por grado para ordenar matrícula, horarios y materias.',
    },
  },
  {
    key: 'admin-courses',
    to: '/admin/courses',
    label: 'Cursos',
    contextualTip: 'Conecta grados, secciones y mallas para estructurar la oferta academica de forma ordenada.',
    icon: Package,
    section: 'academic',
    roles: [USER_ROLES.ADMIN],
    showInNavbar: false,
    tourId: 'nav-admin-courses',
    onboarding: {
      internalTarget: 'main h1',
      internalDescription: 'Cursos conecta grados, secciones y mallas para estructurar la oferta académica real.',
    },
  },
    {
    key: 'messages',
    to: '/messages',
    label: 'Mensajes',
    contextualTip: 'Comunicate de forma directa con otros usuarios: conversaciones por hilo con trazabilidad y contexto.',
    icon: MessageCircleMore,
    section: 'communication',
    roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.TUTOR],
    tourId: 'nav-messages',
    onboarding: {
      internalTarget: '.msg-container',
      internalDescription: 'Mensajes separa conversaciones y chat activo para que mantengas contexto y trazabilidad por hilo.',
    },
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

export function getOnboardingNavigationItems(user, options = {}) {
  return getNavigationItems(user, { surface: 'sidebar', ...options })
    .filter((item) => item.tourId)
    .filter((item) => item.onboarding !== false)
}
