import { useState, useEffect } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import { useAuth } from '../state/AuthContext'
import { useLocation } from 'react-router-dom'

const TOUR_STORAGE_KEY = 'devtrack-tour-completed'

// Tours específicos por rol
const STUDENT_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2>¡Bienvenido a DevTrack! 👋</h2>
        <p>Te mostraremos las características principales de la plataforma para estudiantes.</p>
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
    content: 'Aquí recibirás notificaciones sobre tus inscripciones, ejercicios y calificaciones.',
    disableBeacon: true,
  },
  {
    target: '.dashboard-title',
    content: 'Este es tu panel principal donde ves un resumen de tu progreso académico.',
    disableBeacon: true,
  },
  {
    target: '.stats-grid-responsive',
    content: 'Estadísticas rápidas: total de resultados, verdes/amarillos/rojos, tasa de éxito y pendientes.',
    disableBeacon: true,
  },
  {
    target: '.subjects-grid-responsive',
    content: 'Aquí verás todas tus materias. Haz clic en una para ver ejercicios y resultados detallados.',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3>✨ ¡Tour completado!</h3>
        <p>Explora el resto de la plataforma:</p>
        <ul style={{ textAlign: 'left', marginTop: '10px' }}>
          <li>📊 <strong>Mis Resultados:</strong> Ver todas tus calificaciones</li>
          <li>👤 <strong>Perfil:</strong> Actualizar tu información personal</li>
        </ul>
        <p style={{ marginTop: '15px' }}>Puedes reactivar este tour desde tu perfil.</p>
      </div>
    ),
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
        <p>Te guiaremos por las herramientas principales para gestionar tus clases.</p>
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
    target: '.dashboard-title',
    content: 'Panel de control principal para gestionar tus materias y estudiantes.',
    disableBeacon: true,
  },
  {
    target: '.stats-grid',
    content: 'Resumen de materias creadas y total de estudiantes inscritos.',
    disableBeacon: true,
  },
  {
    target: '.data-table',
    content: 'Lista de tus materias. Haz clic en una para ver estudiantes, ejercicios y subir resultados CSV.',
    disableBeacon: true,
  },
  {
    target: 'a[href="/subjects"]',
    content: 'Usa "Gestión de Materias" para crear nuevas materias, ejercicios e inscribir estudiantes.',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3>✨ ¡Tour completado!</h3>
        <p>Funcionalidades clave para profesores:</p>
        <ul style={{ textAlign: 'left', marginTop: '10px' }}>
          <li>📚 <strong>Gestión de Materias:</strong> CRUD completo de materias</li>
          <li>📝 <strong>Ejercicios:</strong> Crear y gestionar ejercicios</li>
          <li>👥 <strong>Inscripciones:</strong> Inscribir estudiantes manualmente o por CSV</li>
          <li>📊 <strong>Resultados:</strong> Subir calificaciones masivamente con CSV</li>
        </ul>
        <p style={{ marginTop: '15px' }}>Puedes reactivar este tour desde tu perfil.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

const ADMIN_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2>¡Bienvenido Administrador! 🔐</h2>
        <p>Tienes acceso completo a todas las funcionalidades del sistema.</p>
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
    content: 'Recibirás notificaciones de toda la actividad del sistema.',
    disableBeacon: true,
  },
  {
    target: '.dashboard-title',
    content: 'Panel de administración: gestión completa de materias y usuarios.',
    disableBeacon: true,
  },
  {
    target: '.stats-grid',
    content: 'Estadísticas globales del sistema.',
    disableBeacon: true,
  },
  {
    target: 'a[href="/subjects"]',
    content: 'Como admin, puedes ver y editar TODAS las materias del sistema, no solo las tuyas.',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3>✨ ¡Tour completado!</h3>
        <p>Como administrador tienes:</p>
        <ul style={{ textAlign: 'left', marginTop: '10px' }}>
          <li>🔐 <strong>Acceso total:</strong> Ver/editar todas las materias</li>
          <li>👥 <strong>Gestión de usuarios:</strong> Via Django Admin</li>
          <li>📊 <strong>Supervisión:</strong> Monitorear toda la plataforma</li>
        </ul>
        <p style={{ marginTop: '15px' }}>Puedes reactivar este tour desde tu perfil.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

export default function AppTour() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState([])

  useEffect(() => {
    // Solo mostrar el tour si:
    // 1. Usuario autenticado
    // 2. Está en la página principal (Dashboard)
    // 3. No ha completado el tour antes
    if (
      isAuthenticated &&
      user &&
      location.pathname === '/' &&
      !localStorage.getItem(`${TOUR_STORAGE_KEY}-${user.role}`)
    ) {
      // Seleccionar steps según el rol
      let tourSteps = []
      if (user.role === 'STUDENT') {
        tourSteps = STUDENT_STEPS
      } else if (user.role === 'TEACHER') {
        tourSteps = TEACHER_STEPS
      } else if (user.role === 'ADMIN') {
        tourSteps = ADMIN_STEPS
      }

      setSteps(tourSteps)
      
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => setRun(true), 1000)
    }
  }, [isAuthenticated, user, location])

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data

    // Tour finalizado o saltado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      // Marcar como completado en localStorage
      if (user) {
        localStorage.setItem(`${TOUR_STORAGE_KEY}-${user.role}`, 'true')
      }
    }

    // Si el usuario cierra el tour con ESC o hace clic fuera
    if (action === ACTIONS.CLOSE) {
      setRun(false)
      if (user) {
        localStorage.setItem(`${TOUR_STORAGE_KEY}-${user.role}`, 'true')
      }
    }
  }

  // Función para reiniciar el tour (puede ser llamada desde el perfil)
  const restartTour = () => {
    if (user) {
      localStorage.removeItem(`${TOUR_STORAGE_KEY}-${user.role}`)
      window.location.href = '/' // Redirigir al dashboard
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
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: 'var(--bg-card)',
          backgroundColor: 'var(--bg-card)',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: 'var(--primary)',
          textColor: 'var(--text-primary)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          fontSize: '15px',
        },
        tooltipContent: {
          padding: '10px 0',
        },
        buttonNext: {
          backgroundColor: 'var(--primary)',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          color: 'var(--text-secondary)',
          marginRight: '10px',
        },
        buttonSkip: {
          color: 'var(--text-secondary)',
        },
        buttonClose: {
          display: 'none',
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
