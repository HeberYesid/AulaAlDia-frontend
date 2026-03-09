import { useState, useEffect } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import { useAuth } from '../state/AuthContext'
import { useLocation } from 'react-router-dom'

const TOUR_STORAGE_KEY = 'aulaaldia-tour-completed'

function completionContent(title, features) {
  return (
    <div>
      <h3>✨ {title}</h3>
      <p>Funcionalidades destacadas que puedes explorar:</p>
      <ul style={{ textAlign: 'left', marginTop: '10px' }}>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <p style={{ marginTop: '15px' }}>Puedes reactivar este tour desde tu perfil.</p>
    </div>
  )
}

const STUDENT_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2>¡Bienvenido a AulaAlDía! 👋</h2>
        <p>Este recorrido te mostrará las funciones nuevas y los atajos clave para estudiantes.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.theme-toggle',
    content: 'Cambia entre tema claro y oscuro según tu preferencia.',
    disableBeacon: true,
  },
  {
    target: '.notification-bell',
    content: 'Aquí recibes alertas de ejercicios, notas, boletines y avisos importantes.',
    disableBeacon: true,
  },
  {
    target: '.subjects-grid-responsive',
    content: 'Mis Materias: entra a cada materia para revisar tareas, resultados y estado académico.',
    disableBeacon: true,
  },
  {
    target: '.exercises-grid-responsive',
    content: 'Aquí encuentras Ejercicios Pendientes y tus Últimos Resultados para actuar rápidamente.',
    disableBeacon: true,
  },
  {
    target: '.welcome-panel',
    content: 'Panel de bienvenida con últimas notificaciones, rol activo y datos de tu sesión reciente.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/my"]',
    content: 'Resultados: consulta tu historial completo de calificaciones y comentarios.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/my-subjects"]',
    content: 'Mis Materias: revisa el progreso detallado y el rendimiento por asignatura.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/my-bulletins"]',
    content: 'Boletines: genera y descarga reportes de desempeño académico.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/messages"]',
    content: 'Mensajes: comunícate con docentes y mantén seguimiento de conversaciones.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/calendar"]',
    content: 'Calendario: organiza entregas, evaluaciones y eventos académicos.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/observer"]',
    content: 'Observador: revisa anotaciones y seguimiento académico.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/absences"]',
    content: 'Asistencia: verifica faltas justificadas y pendientes de justificación.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__profile',
    content: 'Perfil: actualiza tus datos y también puedes reiniciar este tour cuando quieras.',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: completionContent('¡Tour completado!', [
      '📚 Mis Materias y progreso por asignatura',
      '📊 Resultados, boletines y observador',
      '📅 Calendario y recordatorios clave',
      '💬 Mensajería con el equipo académico',
    ]),
    placement: 'center',
    disableBeacon: true,
  },
]

const TEACHER_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2>¡Bienvenido Profesor! 👨‍🏫</h2>
        <p>Te mostraremos el flujo actualizado para gestionar clases, seguimiento y comunicación.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.theme-toggle',
    content: 'Cambia entre tema claro y oscuro según tu preferencia.',
    disableBeacon: true,
  },
  {
    target: '.notification-bell',
    content: 'Recibirás notificaciones cuando estudiantes se inscriban o completen ejercicios.',
    disableBeacon: true,
  },
  {
    target: '.data-table',
    content: 'Dashboard con listado de materias: entra a detalle para ejercicios, estudiantes y resultados.',
    disableBeacon: true,
  },
  {
    target: '.welcome-panel',
    content: 'Panel de bienvenida con notificaciones recientes y actividad de sesión.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/subjects"]',
    content: 'Gestión de Materias: crea cursos, ejercicios, inscripciones y carga de resultados CSV.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/messages"]',
    content: 'Mensajes: comunicación directa con estudiantes y coordinación académica.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/calendar"]',
    content: 'Calendario: planifica fechas límite, clases y actividades.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/observer"]',
    content: 'Observador: registra y revisa observaciones de seguimiento por estudiante.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/absences"]',
    content: 'Asistencia: controla faltas y su estado de justificación.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__profile',
    content: 'Perfil: personaliza datos, configuración y reinicia este tour cuando quieras.',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: completionContent('¡Tour completado!', [
      '📚 Materias, ejercicios e inscripciones',
      '📥 Carga de resultados por CSV y seguimiento',
      '💬 Mensajería y coordinación con estudiantes',
      '📅 Calendario, observador y asistencia',
    ]),
    placement: 'center',
    disableBeacon: true,
  },
]

const ADMIN_STEPS = [
  ...TEACHER_STEPS.slice(0, -1),
  {
    target: '.sidebar__nav a[href="/admin/commercial"]',
    content: 'Comercial Tenant: vista administrativa global para gestión comercial multi-tenant.',
    disableBeacon: true,
  },
  TEACHER_STEPS[TEACHER_STEPS.length - 1],
]

const TUTOR_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2>¡Bienvenido Acudiente! 👪</h2>
        <p>Este tour te guía por las herramientas para monitorear el progreso académico.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.theme-toggle',
    content: 'Cambia entre tema claro y oscuro según tu preferencia.',
    disableBeacon: true,
  },
  {
    target: '.notification-bell',
    content: 'Recibe alertas sobre avances, resultados y novedades de los estudiantes vinculados.',
    disableBeacon: true,
  },
  {
    target: '.data-table',
    content: 'Dashboard con materias vinculadas para revisar el estado general de cada estudiante.',
    disableBeacon: true,
  },
  {
    target: '.welcome-panel',
    content: 'Panel de bienvenida con notificaciones recientes e información de acceso.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/my"]',
    content: 'Progreso: vista consolidada de desempeño académico.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/my-subjects"]',
    content: 'Mis Materias: detalle por materia para el seguimiento familiar.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/my-bulletins"]',
    content: 'Boletines: consulta reportes de rendimiento.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/calendar"]',
    content: 'Calendario: mantén al día fechas relevantes de actividades y entregas.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/observer"]',
    content: 'Observador: revisa observaciones registradas por docentes.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__nav a[href="/absences"]',
    content: 'Asistencia: consulta faltas y estado de justificación.',
    disableBeacon: true,
  },
  {
    target: '.sidebar__profile',
    content: 'Perfil: gestiona tu cuenta y reinicia este tour cuando quieras.',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: completionContent('¡Tour completado!', [
      '👀 Seguimiento de progreso y materias vinculadas',
      '📄 Consulta de boletines y observaciones',
      '📅 Calendario y control de asistencia',
      '🔔 Notificaciones para mantenerte informado',
    ]),
    placement: 'center',
    disableBeacon: true,
  },
]

function getStepsByRole(role) {
  if (role === 'STUDENT') return STUDENT_STEPS
  if (role === 'TEACHER') return TEACHER_STEPS
  if (role === 'ADMIN') return ADMIN_STEPS
  if (role === 'TUTOR') return TUTOR_STEPS
  return []
}

function isTargetAvailable(target) {
  if (target === 'body') return true
  return Boolean(document.querySelector(target))
}

export default function AppTour() {
  const { user } = useAuth()
  const location = useLocation()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState([])
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    let timerId = null
    let retryTimerId = null

    if (location.pathname !== '/') {
      setRun(false)
      return () => {
        if (timerId) clearTimeout(timerId)
        if (retryTimerId) clearTimeout(retryTimerId)
      }
    }

    if (!user || !user.role) {
      return () => {
        if (timerId) clearTimeout(timerId)
        if (retryTimerId) clearTimeout(retryTimerId)
      }
    }

    const tourKey = `${TOUR_STORAGE_KEY}-${user.role}`
    const hasCompletedTour = localStorage.getItem(tourKey)

    if (location.pathname === '/' && !hasCompletedTour) {
      const tourSteps = getStepsByRole(user.role)
      if (tourSteps.length > 0) {
        let attempts = 0
        const totalNonBodySteps = tourSteps.filter((step) => step.target !== 'body').length
        const minNonBodyTargets = Math.min(3, totalNonBodySteps)

        const prepareAndRunTour = () => {
          const availableSteps = tourSteps.filter((step) => isTargetAvailable(step.target))
          const availableNonBodyTargets = availableSteps.filter((step) => step.target !== 'body').length
          const hasEnoughTargets = minNonBodyTargets === 0 || availableNonBodyTargets >= minNonBodyTargets

          if (availableSteps.length > 0 && (hasEnoughTargets || attempts >= 7)) {
            setSteps(availableSteps)
            setStepIndex(0)
            setRun(true)
            return
          }

          attempts += 1
          if (attempts < 8) {
            retryTimerId = setTimeout(prepareAndRunTour, 300)
          }
        }

        // Esperar a que el dashboard termine de montar antes de buscar targets
        timerId = setTimeout(prepareAndRunTour, 600)
      }
    }

    return () => {
      if (timerId) clearTimeout(timerId)
      if (retryTimerId) clearTimeout(retryTimerId)
    }
  }, [user, location.pathname])

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data

    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      setStepIndex(0)
      if (user) {
        localStorage.setItem(`${TOUR_STORAGE_KEY}-${user.role}`, 'true')
      }
    }

    if (action === ACTIONS.CLOSE && type === EVENTS.TOUR_END) {
      setRun(false)
      setStepIndex(0)
      if (user) {
        localStorage.setItem(`${TOUR_STORAGE_KEY}-${user.role}`, 'true')
      }
    }
  }

  // Función para reiniciar el tour (puede ser llamada desde el perfil)
  const restartTour = () => {
    if (user) {
      localStorage.removeItem(`${TOUR_STORAGE_KEY}-${user.role}`)
      window.location.href = '/'
    }
  }

  // Exportar función para uso externo
  if (typeof window !== 'undefined') {
    window.restartAppTour = restartTour
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      disableOverlayClose
      hideCloseButton
      spotlightClicks={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.8)',
          primaryColor: '#1976d2',
          textColor: '#333333',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          fontSize: '15px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        },
        tooltipContent: {
          padding: '10px 0',
        },
        buttonNext: {
          backgroundColor: '#1976d2',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#ffffff',
        },
        buttonBack: {
          color: '#666666',
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#666666',
        },
        buttonClose: {
          display: 'none',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
    />
  )
}

// Exportar función para reiniciar el tour
export const resetTour = (role) => {
  if (role) {
    localStorage.removeItem(`${TOUR_STORAGE_KEY}-${role}`)
  }
}
