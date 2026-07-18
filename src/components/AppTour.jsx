import { useEffect, useMemo, useState } from 'react'
import Joyride, { ACTIONS, EVENTS } from 'react-joyride'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useTour } from '../state/TourContext'

function getModuleNavStep(module, currentIndex, totalModules) {
  if (!module) return null

  return {
    target: `[data-tour-id="${module.tourId}"]`,
    content: (
      <div className="tour__step">
        <span className="tour__step-badge">
          Modulo {currentIndex + 1} de {totalModules}
        </span>
        <h3 className="tour__step-title">{module.label}</h3>
        <p className="tour__step-desc">{module.contextualTip}</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'right',
    disableOverlay: false,
    spotlightClicks: true,
    data: { gate: 'route', route: module.to },
  }
}

function createWelcomeStep(totalModules) {
  return {
    target: 'body',
    content: (
      <div className="tour__step tour__step--welcome">
        <h3 className="tour__step-title">Bienvenido a la plataforma</h3>
        <p className="tour__step-desc">
          Te mostraremos los {totalModules} modulos principales en un recorrido
          rapido. Podes pausarlo cuando quieras y retomarlo mas tarde desde tu
          perfil.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    data: { gate: 'welcome' },
  }
}

function createCompletionStep() {
  return {
    target: 'body',
    content: (
      <div className="tour__step tour__step--completion">
        <h3 className="tour__step-title">Recorrido completo</h3>
        <p className="tour__step-desc">
          Ya conoces los modulos principales. Podes repetir este recorrido
          cuando quieras desde tu perfil.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    data: { gate: 'finish' },
  }
}

export default function AppTour() {
  const { user } = useAuth()
  const location = useLocation()
  const {
    modules,
    currentModule,
    currentModuleIndex,
    totalModules,
    isActive,
    isCompleted,
    pauseTour,
    restartTour,
    skipTour,
    completeCurrentModule,
  } = useTour()
  const [stepIndex, setStepIndex] = useState(0)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  const steps = useMemo(() => {
    if (isFinishing) return [createCompletionStep()]
    if (!currentModule) return []

    const navStep = getModuleNavStep(currentModule, currentModuleIndex, totalModules)
    const isOnRoute = location.pathname === currentModule.to

    if (currentModuleIndex === 0 && !welcomeDone) {
      if (isOnRoute) return [createWelcomeStep(totalModules)]
      if (navStep) return [createWelcomeStep(totalModules), navStep]
      return [createWelcomeStep(totalModules)]
    }

    if (isOnRoute) return []
    if (navStep) return [navStep]
    return []
  }, [currentModule, currentModuleIndex, totalModules, location.pathname, welcomeDone, isFinishing])

  const joyrideRenderKey = `${currentModuleIndex}::${location.pathname}::${steps.length}::${welcomeDone}::${isFinishing}`

  useEffect(() => {
    if (!isActive || isCompleted || steps.length > 0) return
    if (!currentModule || location.pathname !== currentModule.to) return

    if (currentModuleIndex >= modules.length - 1) {
      setIsFinishing(true)
      return
    }

    completeCurrentModule()
  }, [isActive, isCompleted, steps.length, location.pathname, currentModule, currentModuleIndex, modules.length, completeCurrentModule])

  useEffect(() => {
    setStepIndex(0)
    if (currentModuleIndex === 0) {
      setWelcomeDone(false)
    }
    setIsFinishing(false)
  }, [currentModuleIndex])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.restartAppTour = () => {
      setWelcomeDone(false)
      setIsFinishing(false)
      setStepIndex(0)
      restartTour()
    }
  }, [restartTour])

  if (!user?.role || isCompleted || !isActive || steps.length === 0) {
    return null
  }

  const currentStep = steps[stepIndex] || steps[0]

  function handleJoyrideCallback(data) {
    const { action, type } = data

    if (action === ACTIONS.SKIP) {
      skipTour()
      return
    }

    if (action === ACTIONS.CLOSE) {
      pauseTour()
      return
    }

    if (type !== EVENTS.STEP_AFTER) return

    const gate = currentStep?.data?.gate

    if (gate === 'welcome') {
      setWelcomeDone(true)
      return
    }

    if (gate === 'finish') {
      skipTour()
      return
    }

    if (gate === 'route') {
      if (currentModuleIndex >= modules.length - 1) {
        setIsFinishing(true)
        setStepIndex(0)
        return
      }
      completeCurrentModule()
      return
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1)
      return
    }

    if (currentModuleIndex >= modules.length - 1) {
      setIsFinishing(true)
      setStepIndex(0)
      return
    }

    completeCurrentModule()
  }

  return (
    <Joyride
      key={joyrideRenderKey}
      steps={steps}
      run={isActive}
      stepIndex={stepIndex}
      continuous
      showProgress={false}
      showSkipButton={true}
      scrollToFirstStep
      disableScrolling={false}
      disableOverlayClose
      hideCloseButton={false}
      spotlightClicks={Boolean(currentStep?.data?.gate === 'route')}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          primaryColor: '#1976d2',
          textColor: '#333333',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          fontSize: '15px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          maxWidth: '360px',
        },
        tooltipContent: {
          padding: '8px 0',
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
          display: 'none',
        },
        buttonClose: {
          color: '#888888',
        },
        buttonSkip: {
          color: '#999999',
          fontSize: '13px',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
      locale={{
        back: 'Atras',
        close: 'Pausar',
        last: isFinishing ? 'Finalizar' : 'Siguiente',
        next: 'Continuar',
        skip: 'Saltar tour',
      }}
    />
  )
}

export function resetTour() {
  if (typeof window !== 'undefined' && typeof window.restartAppTour === 'function') {
    window.restartAppTour()
  }
}
