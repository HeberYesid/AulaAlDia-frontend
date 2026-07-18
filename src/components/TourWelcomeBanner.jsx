import { useAuth } from '../state/AuthContext'
import { useTour } from '../state/TourContext'
import { X, Map } from 'lucide-react'

export default function TourWelcomeBanner() {
  const { user } = useAuth()
  const { isActive, isCompleted, status, startOrResumeTour, pauseTour, totalModules } = useTour()

  if (!user?.role || isCompleted || isActive || totalModules === 0) return null
  if (!['idle', 'paused'].includes(status)) return null

  const isResuming = status === 'paused'

  return (
    <div className="tour-welcome-banner" role="status" aria-live="polite">
      <div className="tour-welcome-banner__content">
        <span className="tour-welcome-banner__icon" aria-hidden="true">
          <Map size={20} />
        </span>
        <div className="tour-welcome-banner__text">
          <p className="tour-welcome-banner__title">
            {isResuming ? 'Tu recorrido esta pausado' : 'Bienvenido a la plataforma'}
          </p>
          <p className="tour-welcome-banner__subtitle">
            {isResuming
              ? 'Retoma el recorrido guiado para seguir conociendo los modulos.'
              : `Te mostramos los ${totalModules} modulos principales en un recorrido rapido.`}
          </p>
        </div>
      </div>
      <div className="tour-welcome-banner__actions">
        <button
          type="button"
          className="tour-welcome-banner__btn tour-welcome-banner__btn--primary"
          onClick={startOrResumeTour}
        >
          {isResuming ? 'Continuar recorrido' : 'Iniciar recorrido'}
        </button>
        <button
          type="button"
          className="tour-welcome-banner__btn tour-welcome-banner__btn--ghost"
          onClick={pauseTour}
          aria-label="Ocultar aviso del tour"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
