import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { getOnboardingNavigationItems } from '../utils/navigation'
import { useAuth } from './AuthContext'

const TourContext = createContext(null)

const TOUR_PROGRESS_VERSION = 'v2'
const TOUR_STORAGE_PREFIX = `aulaaldia-tour-progress-${TOUR_PROGRESS_VERSION}`
const FALLBACK_TOUR_CONTEXT = {
  modules: [],
  currentModule: null,
  currentModuleIndex: 0,
  isActive: false,
  isCompleted: false,
  status: 'idle',
  startOrResumeTour: () => {},
  pauseTour: () => {},
  restartTour: () => {},
  completeCurrentModule: () => {},
  storageKey: null,
}

function getTourStorageKey(user) {
  if (!user?.role) return null

  const userIdentifier =
    user.id ??
    user.public_id ??
    user.email ??
    user.username ??
    user.role

  return `${TOUR_STORAGE_PREFIX}-${user.role}-${String(userIdentifier)}`
}



function getDefaultProgress() {
  return {
    status: 'idle',
    currentModuleIndex: 0,
  }
}

export function TourProvider({ children }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState(getDefaultProgress)

  const modules = useMemo(
    () => getOnboardingNavigationItems(user, { surface: 'sidebar' }),
    [user]
  )

  const storageKey = useMemo(() => getTourStorageKey(user), [user])
  const currentModule = modules[progress.currentModuleIndex] || null
  const isActive = progress.status === 'active'
  const isCompleted = progress.status === 'completed'

  useEffect(() => {
    if (!storageKey) {
      setProgress(getDefaultProgress())
      return
    }

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        setProgress(getDefaultProgress())
        return
      }

      const parsed = JSON.parse(raw)
      setProgress({
        status: parsed?.status || 'idle',
        currentModuleIndex: Number.isInteger(parsed?.currentModuleIndex) ? parsed.currentModuleIndex : 0,
      })
    } catch {
      setProgress(getDefaultProgress())
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [progress, storageKey])

  const startOrResumeTour = useCallback(() => {
    setProgress((current) => ({
      ...current,
      status: 'active',
      currentModuleIndex:
        current.status === 'completed' || current.currentModuleIndex >= modules.length ? 0 : current.currentModuleIndex,
    }))
  }, [modules.length])

  const pauseTour = useCallback(() => {
    setProgress((current) => ({ ...current, status: 'paused' }))
  }, [])

  const restartTour = useCallback(() => {
    setProgress({
      status: 'active',
      currentModuleIndex: 0,
    })
  }, [])

  const completeCurrentModule = useCallback(() => {
    setProgress((current) => {
      const nextIndex = current.currentModuleIndex + 1

      if (nextIndex >= modules.length) {
        return {
          status: 'completed',
          currentModuleIndex: modules.length,
        }
      }

      return {
        status: 'active',
        currentModuleIndex: nextIndex,
      }
    })
  }, [modules.length])

  const value = useMemo(() => ({
    modules,
    currentModule,
    currentModuleIndex: progress.currentModuleIndex,
    isActive,
    isCompleted,
    status: progress.status,
    startOrResumeTour,
    pauseTour,
    restartTour,
    completeCurrentModule,
    storageKey,
  }), [
    modules,
    currentModule,
    progress.currentModuleIndex,
    progress.status,
    isActive,
    isCompleted,
    storageKey,
    startOrResumeTour,
    pauseTour,
    restartTour,
    completeCurrentModule,
  ])

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTour() {
  const value = useContext(TourContext)
  return value || FALLBACK_TOUR_CONTEXT
}
