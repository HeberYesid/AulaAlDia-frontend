import { useEffect, useMemo, useState } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useTour } from '../state/TourContext'
import { getTourStartPath } from '../utils/tourHelpers'

function getTarget(selector) {
  if (!selector || selector === 'body') return 'body'
  if (typeof document !== 'undefined' && document.querySelector(selector)) {
    return selector
  }
  return 'body'
}

function getModuleSteps(module, pathname) {
  if (!module) return []

  if (pathname !== module.to) {
    const routeTarget = `[data-tour-id="${module.tourId}"]`

    return [
      {
        target: routeTarget,
        content: `${module.label} sirve para ${module.contextualTip}`,
        disableBeacon: true,
        placement: 'right',
        data: {
          gate: 'route',
          route: module.to,
          allowSpotlightClicks: true,
        },
      },
    ]
  }

  return []
}

export default function AppTour() {
  const { user } = useAuth()
  const location = useLocation()
  const {
    modules,
    currentModule,
    isActive,
    isCompleted,
    status,
    startOrResumeTour,
    pauseTour,
    restartTour,
    completeCurrentModule,
  } = useTour()
  const [stepIndex, setStepIndex] = useState(0)

  const tourStartPath = getTourStartPath(user?.role)
  const steps = useMemo(
    () => getModuleSteps(currentModule, location.pathname),
    [currentModule, location.pathname]
  )
  const joyrideRenderKey = `${currentModule?.key || 'none'}::${location.pathname}::${steps.length}`

  useEffect(() => {
    if (!user?.role || isCompleted || modules.length === 0) return
    if (status === 'idle' && location.pathname !== tourStartPath) return
    if (!['idle', 'paused'].includes(status)) return

    const timerId = window.setTimeout(() => {
      startOrResumeTour()
    }, 500)

    return () => window.clearTimeout(timerId)
  }, [isCompleted, location.pathname, modules.length, startOrResumeTour, status, tourStartPath, user?.role])

  useEffect(() => {
    setStepIndex(0)
  }, [currentModule?.key, location.pathname, steps.length])

  useEffect(() => {
    if (!isActive || !currentModule || steps.length !== 0) return
    if (location.pathname !== currentModule.to) return

    completeCurrentModule()
  }, [completeCurrentModule, currentModule, isActive, location.pathname, steps.length])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.restartAppTour = restartTour
  }, [restartTour])

  if (!user?.role || isCompleted || !isActive || steps.length === 0) {
    return null
  }

  const currentStep = steps[stepIndex] || steps[0]

  function handleJoyrideCallback(data) {
    const { action, status: joyrideStatus, type } = data

    if (joyrideStatus === STATUS.FINISHED) {
      completeCurrentModule()
      return
    }

    if (action === ACTIONS.CLOSE || joyrideStatus === STATUS.SKIPPED) {
      pauseTour()
      return
    }

    if (type !== EVENTS.STEP_AFTER) return

    const gate = currentStep?.data?.gate

    if (gate === 'next') {
      if (stepIndex < steps.length - 1) {
        setStepIndex((current) => current + 1)
        return
      }

      completeCurrentModule()
      return
    }

    if (gate === 'route') {
      if (location.pathname !== currentStep?.data?.route) {
        setStepIndex(0)
      }
      return
    }
  }

  return (
    <Joyride
      key={joyrideRenderKey}
      steps={steps}
      run={isActive}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton={false}
      scrollToFirstStep
      disableScrolling={false}
      disableOverlayClose
      hideCloseButton={false}
      spotlightClicks={Boolean(currentStep?.data?.allowSpotlightClicks)}
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
        buttonClose: {
          color: '#666666',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Pausar tour',
        last: 'Finalizar',
        next: 'Continuar',
        skip: 'Pausar tour',
      }}
    />
  )
}

export function resetTour() {
  if (typeof window !== 'undefined' && typeof window.restartAppTour === 'function') {
    window.restartAppTour()
  }
}
