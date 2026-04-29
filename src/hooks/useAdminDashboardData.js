import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { unwrapListData } from '../utils/pagination'
import { sanitizeAcademicPeriodLabel } from '../utils/academicPeriodPresentation'

function toDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toDateOnly(value) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function resolveActiveAcademicPeriod(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null

  const today = toDateOnly(new Date())
  if (!today) return null

  const byOrderAsc = [...periods]
    .filter((period) => !period?.is_closed)
    .filter((period) => {
      const startDate = toDateOnly(period.start_date)
      const endDate = toDateOnly(period.end_date)

      if (startDate && today < startDate) return false
      if (endDate && today > endDate) return false
      return true
    })
    .sort((first, second) => {
      const yearDiff = Number(first.year || 0) - Number(second.year || 0)
      if (yearDiff !== 0) return yearDiff

      const firstSequence = Number(first.sequence || 0)
      const secondSequence = Number(second.sequence || 0)
      return firstSequence - secondSequence
    })

  return byOrderAsc[0] || null
}

function filterItemsByAcademicPeriod(items, academicPeriod, dateField) {
  if (!Array.isArray(items) || items.length === 0 || !academicPeriod) return []

  const startDate = toDateOnly(academicPeriod.start_date)
  const endDate = toDateOnly(academicPeriod.end_date)
  const hasBoundaryDates = Boolean(startDate || endDate)
  const periodYear = Number(academicPeriod.year || 0)

  const resolveItemDate = (item) => {
    const fields = Array.isArray(dateField) ? dateField : [dateField]
    for (const field of fields) {
      const parsed = toDateOnly(item?.[field])
      if (parsed) return parsed
    }
    return null
  }

  return items.filter((item) => {
    const date = resolveItemDate(item)
    if (!date) return false
    if (!hasBoundaryDates && periodYear > 0 && date.getFullYear() !== periodYear) {
      return false
    }
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  })
}

function formatAcademicPeriodLabel(period) {
  if (!period) return '-'

  const label = sanitizeAcademicPeriodLabel(period.label)
  if (!label) return '-'

  const simplifiedLabel = label.replace(/^\d{4}\s*[-–—]\s*/u, '')
  const trimmedLabel = simplifiedLabel.replace(/^Trimestre\s+/iu, '')
  return trimmedLabel || simplifiedLabel || label
}

function normalizeMessage(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function extractErrorDetail(error) {
  const payload = error?.response?.data
  if (!payload) return ''

  if (typeof payload === 'string') return payload

  if (typeof payload !== 'object') return ''

  if (typeof payload.detail === 'string') return payload.detail
  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    return String(payload.detail[0] || '')
  }

  if (typeof payload.message === 'string') return payload.message
  return ''
}

function getDashboardBlockErrorMessage(error, { sectionLabel }) {
  const errorCode = error?.response?.data?.error_code
  const normalizedDetail = normalizeMessage(extractErrorDetail(error))

  if (
    errorCode === 'NO_ACTIVE_SCHOOL_YEAR' ||
    normalizedDetail.includes('no hay un ano escolar activo')
  ) {
    return `Todavía no hay un año escolar activo para ver ${sectionLabel}. Activa uno en Configuración académica.`
  }

  if (
    errorCode === 'NO_ACTIVE_ACADEMIC_PERIOD' ||
    normalizedDetail.includes('no hay un periodo academico vigente')
  ) {
    return `Todavía no hay un período abierto para hoy en ${sectionLabel}. Abre uno o ajusta sus fechas en Configuración académica.`
  }

  if (error?.response?.status === 403) {
    return `No tienes permiso para ver ${sectionLabel}.`
  }

  if (error?.response?.status >= 500) {
    return `No pudimos cargar ${sectionLabel} por un problema temporal. Inténtalo de nuevo en unos minutos.`
  }

  return getApiErrorMessage(error, {
    action: `cargar ${sectionLabel}`,
    fallback: `No pudimos cargar ${sectionLabel}. Inténtalo nuevamente.`,
  })
}

export default function useAdminDashboardData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState([])
  const [subjectStats, setSubjectStats] = useState([])
  const [absences, setAbsences] = useState([])
  const [observations, setObservations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [academicPeriods, setAcademicPeriods] = useState([])
  const [academicSettings, setAcademicSettings] = useState(null)
  const [blockErrors, setBlockErrors] = useState({})

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const nextBlockErrors = {}
    let nextSubjects = []

    try {
      const [
        subjectsResult,
        absencesResult,
        observationsResult,
        notificationsResult,
        calendarResult,
        periodsResult,
        settingsResult,
      ] = await Promise.allSettled([
        api.get('/api/v1/courses/subjects/'),
        api.get('/api/v1/courses/absences/'),
        api.get('/api/v1/courses/observations/'),
        api.get('/api/v1/courses/notifications/'),
        api.get('/api/v1/courses/calendar/all_events/'),
        api.get('/api/v1/courses/academic-periods/'),
        api.get('/api/v1/courses/academic-settings/'),
      ])

      if (subjectsResult.status === 'fulfilled') {
        nextSubjects = unwrapListData(subjectsResult.value.data)
        setSubjects(nextSubjects)
      } else {
        nextBlockErrors.subjects = getDashboardBlockErrorMessage(subjectsResult.reason, {
          sectionLabel: 'las materias',
        })
        setSubjects([])
      }

      if (absencesResult.status === 'fulfilled') {
        setAbsences(unwrapListData(absencesResult.value.data))
      } else {
        nextBlockErrors.absences = getDashboardBlockErrorMessage(absencesResult.reason, {
          sectionLabel: 'las faltas',
        })
        setAbsences([])
      }

      if (observationsResult.status === 'fulfilled') {
        setObservations(unwrapListData(observationsResult.value.data))
      } else {
        nextBlockErrors.observations = getDashboardBlockErrorMessage(observationsResult.reason, {
          sectionLabel: 'las observaciones',
        })
        setObservations([])
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotifications(unwrapListData(notificationsResult.value.data))
      } else {
        nextBlockErrors.notifications = getDashboardBlockErrorMessage(
          notificationsResult.reason,
          {
            sectionLabel: 'las notificaciones',
          }
        )
        setNotifications([])
      }

      if (calendarResult.status === 'fulfilled') {
        const events = unwrapListData(calendarResult.value.data)
        const now = new Date()
        const future = events
          .filter((event) => {
            const startValue = event.start || event.start_time || event.date
            const startDate = toDate(startValue)
            return startDate && startDate >= now
          })
          .sort((a, b) => {
            const first = toDate(a.start || a.start_time || a.date)?.getTime() || 0
            const second = toDate(b.start || b.start_time || b.date)?.getTime() || 0
            return first - second
          })
          .slice(0, 5)

        setUpcomingEvents(future)
      } else {
        nextBlockErrors.calendar = getDashboardBlockErrorMessage(calendarResult.reason, {
          sectionLabel: 'los eventos del calendario',
        })
        setUpcomingEvents([])
      }

      if (periodsResult.status === 'fulfilled') {
        const periods = unwrapListData(periodsResult.value.data)
        setAcademicPeriods(periods)
      } else {
        nextBlockErrors.periods = getDashboardBlockErrorMessage(periodsResult.reason, {
          sectionLabel: 'los períodos académicos',
        })
        setAcademicPeriods([])
      }

      if (settingsResult.status === 'fulfilled') {
        setAcademicSettings(settingsResult.value.data || null)
      } else {
        nextBlockErrors.academicSettings = getDashboardBlockErrorMessage(
          settingsResult.reason,
          {
            sectionLabel: 'la configuración académica',
          }
        )
        setAcademicSettings(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'cargar el panel de administracion',
        fallback: 'No se pudo cargar el panel de administracion. Verifica tu acceso e intentalo nuevamente.',
      }))
    }

    try {
      if (nextSubjects.length > 0) {
        const subjectIds = nextSubjects.map((subject) => subject.id).join(',')
        const { data } = await api.get('/api/v1/courses/subjects/dashboard-batch/', {
          params: { ids: subjectIds },
        })

        const dashboards = unwrapListData(data)
        const dashboardsBySubjectId = new Map(
          dashboards.map((item) => [item.subject_id, item])
        )

        const nextSubjectStats = nextSubjects
          .map((subject) => {
            const raw = dashboardsBySubjectId.get(subject.id) || {}
            const aggregates = raw.aggregates || {}
            const avgGrade = Number(aggregates.avg_grade ?? aggregates.avg_score ?? 0)

            return {
              subjectId: subject.id,
              subjectName: subject.name,
              avgGrade,
            }
          })
          .filter(Boolean)

        setSubjectStats(nextSubjectStats)

        if (dashboards.length < nextSubjects.length) {
          nextBlockErrors.performance = 'Algunas métricas por materia no estuvieron disponibles.'
        }
      } else {
        setSubjectStats([])
      }
    } catch (performanceError) {
      nextBlockErrors.performance = getDashboardBlockErrorMessage(performanceError, {
        sectionLabel: 'las métricas de rendimiento',
      })
      setSubjectStats([])
    }

    setBlockErrors(nextBlockErrors)

    if (Object.keys(nextBlockErrors).length > 0) {
      setError('Algunas secciones no se pudieron actualizar. Revisa los mensajes en rojo para resolverlo.')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const activeAcademicPeriod = useMemo(() => {
    return resolveActiveAcademicPeriod(academicPeriods)
  }, [academicPeriods])

  const absencesInActivePeriod = useMemo(() => {
    return filterItemsByAcademicPeriod(absences, activeAcademicPeriod, 'date')
  }, [absences, activeAcademicPeriod])

  const observationsInActivePeriod = useMemo(() => {
    return filterItemsByAcademicPeriod(observations, activeAcademicPeriod, ['occurred_on', 'created_at'])
  }, [observations, activeAcademicPeriod])

  const kpis = useMemo(() => {
    const subjectsCount = subjects.length
    const studentsCount = subjects.reduce((acc, subject) => acc + Number(subject.enrollments_count || 0), 0)
    const uniqueTeacherIds = new Set(
      subjects
        .map((subject) => subject?.teacher?.id)
        .filter((teacherId) => teacherId !== null && teacherId !== undefined)
    )
    const teachersCount = uniqueTeacherIds.size
    const currentAcademicYear = activeAcademicPeriod?.year || '-'
    const currentAcademicPeriodLabel = formatAcademicPeriodLabel(activeAcademicPeriod)
    const unreadNotifications = notifications.filter((item) => !item.is_read).length

    return {
      subjectsCount,
      studentsCount,
      teachersCount,
      currentAcademicYear,
      currentAcademicPeriodLabel,
      unreadNotifications,
    }
  }, [subjects, activeAcademicPeriod, notifications])

  const performanceList = useMemo(() => {
    return [...subjectStats]
      .sort((a, b) => b.avgGrade - a.avgGrade)
      .slice(0, 5)
  }, [subjectStats])

  const openPeriods = useMemo(() => {
    return academicPeriods.filter((period) => !period.is_closed).slice(0, 3)
  }, [academicPeriods])

  const openPeriodsSummary = useMemo(() => {
    if (openPeriods.length === 0) return 'Sin periodos academicos activos'
    return openPeriods
      .map((period) => `${sanitizeAcademicPeriodLabel(period.label)}${period.is_grade_locked ? ' (bloqueado)' : ''}`)
      .join(', ')
  }, [openPeriods])

  const nextDeadline = useMemo(() => {
    const periodsWithDeadline = academicPeriods
      .filter((period) => !period.is_closed && period.grading_deadline)
      .sort((first, second) => {
        const firstTime = toDate(first.grading_deadline)?.getTime() || 0
        const secondTime = toDate(second.grading_deadline)?.getTime() || 0
        return firstTime - secondTime
      })
    return periodsWithDeadline[0] || null
  }, [academicPeriods])

  const criticalNotifications = useMemo(() => {
    return notifications
      .filter((item) => !item.is_read)
      .sort((a, b) => {
        const first = toDate(a.created_at)?.getTime() || 0
        const second = toDate(b.created_at)?.getTime() || 0
        return second - first
      })
      .slice(0, 5)
  }, [notifications])

  return {
    loading,
    error,
    blockErrors,
    academicSettings,
    absencesInActivePeriod,
    observationsInActivePeriod,
    kpis,
    performanceList,
    nextDeadline,
    openPeriodsSummary,
    upcomingEvents,
    criticalNotifications,
    loadDashboard,
  }
}
