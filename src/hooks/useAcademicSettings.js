import { useState, useCallback } from 'react'
import { api } from '../api/axios'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

export const DEFAULT_SETTINGS = {
  period_scheme: 'TRIMESTER',
  min_grade: '1.00',
  max_grade: '5.00',
  passing_grade: '3.00',
  lock_grades_after_deadline: true,
}

export const DEFAULT_PERIOD = {
  year: new Date().getFullYear(),
  sequence: 1,
  name: '',
  start_date: '',
  end_date: '',
  grading_deadline: '',
  lock_after_deadline: true,
}

export const DEFAULT_SCHOOL_YEAR = {
  start_date: '',
  end_date: '',
  enrollment_open_date: '',
  enrollment_close_date: '',
  evaluation_type: 'TRIMESTER',
  is_active: false,
}

export function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

export function normalizeApiError(error, fallback, action = 'completar esta accion') {
  return getApiErrorMessage(error, { action, fallback })
}

export function createDefaultPeriod() {
  return {
    year: new Date().getFullYear(),
    sequence: 1,
    name: '',
    start_date: '',
    end_date: '',
    grading_deadline: '',
    lock_after_deadline: true,
  }
}

export function createDefaultSchoolYear() {
  return {
    start_date: '',
    end_date: '',
    enrollment_open_date: '',
    enrollment_close_date: '',
    evaluation_type: 'TRIMESTER',
    is_active: false,
  }
}

export function buildPeriodForm(period) {
  return {
    year: period.year,
    sequence: period.sequence,
    name: period.name || '',
    start_date: period.start_date || '',
    end_date: period.end_date || '',
    grading_deadline: toLocalDateTimeInput(period.grading_deadline),
    lock_after_deadline: Boolean(period.lock_after_deadline),
  }
}

export function useAcademicSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [periods, setPeriods] = useState([])
  const [schoolYears, setSchoolYears] = useState([])
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS)
  const [periodForm, setPeriodForm] = useState(DEFAULT_PERIOD)
  const [schoolYearForm, setSchoolYearForm] = useState(DEFAULT_SCHOOL_YEAR)
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [savingSchoolYear, setSavingSchoolYear] = useState(false)
  const [mutatingSchoolYearId, setMutatingSchoolYearId] = useState(null)
  const activeSchoolYear = schoolYears.find((schoolYear) => schoolYear.is_active) || null

  const loadAcademicAdmin = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [settingsResult, periodsResult, schoolYearsResult] = await Promise.all([
        api.get('/api/v1/courses/academic-settings/'),
        api.get('/api/v1/courses/academic-periods/'),
        api.get('/api/v1/courses/school-years/'),
      ])

      const nextSettings = settingsResult.data || DEFAULT_SETTINGS
      const nextPeriods = periodsResult.data?.results || periodsResult.data || []
      const nextSchoolYears = schoolYearsResult.data?.results || schoolYearsResult.data || []

      setSettings(nextSettings)
      setSettingsForm({
        period_scheme: nextSettings.period_scheme || 'TRIMESTER',
        min_grade: String(nextSettings.min_grade ?? '1.00'),
        max_grade: String(nextSettings.max_grade ?? '5.00'),
        passing_grade: String(nextSettings.passing_grade ?? '3.00'),
        lock_grades_after_deadline: Boolean(nextSettings.lock_grades_after_deadline),
      })
      setPeriods(Array.isArray(nextPeriods) ? nextPeriods : [])
      setSchoolYears(Array.isArray(nextSchoolYears) ? nextSchoolYears : [])
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo cargar la configuracion academica para esta institucion.',
        'cargar la configuracion academica'
      ))
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleSaveSettings(event) {
    event.preventDefault()
    setSavingSettings(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...settingsForm,
        min_grade: Number(settingsForm.min_grade),
        max_grade: Number(settingsForm.max_grade),
        passing_grade: Number(settingsForm.passing_grade),
      }
      const { data } = await api.patch('/api/v1/courses/academic-settings/', payload)
      setSettings(data)
      setSettingsForm({
        period_scheme: data.period_scheme,
        min_grade: String(data.min_grade),
        max_grade: String(data.max_grade),
        passing_grade: String(data.passing_grade),
        lock_grades_after_deadline: Boolean(data.lock_grades_after_deadline),
      })
      setSuccess('Configuración académica actualizada.')
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo actualizar la configuracion academica. Revisa la escala y los rangos de notas.',
        'actualizar la configuracion academica'
      ))
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleCreatePeriod(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!editingPeriodId && !activeSchoolYear) {
      setError('Para crear un periodo académico, primero activa un año escolar.')
      return
    }

    const periodYear = Number(periodForm.year)
    if (!editingPeriodId && activeSchoolYear) {
      const startYear = Number(String(activeSchoolYear.start_date || '').slice(0, 4))
      const endYear = Number(String(activeSchoolYear.end_date || '').slice(0, 4))
      const hasYearBounds = Number.isFinite(startYear) && Number.isFinite(endYear)

      if (hasYearBounds && (periodYear < startYear || periodYear > endYear)) {
        setError(`El año del periodo debe estar entre ${startYear} y ${endYear} según el año escolar activo.`)
        return
      }
    }

    setSavingPeriod(true)

    try {
      const payload = {
        year: periodYear,
        sequence: Number(periodForm.sequence),
        period_number: Number(periodForm.sequence),
        name: periodForm.name,
        start_date: periodForm.start_date || null,
        end_date: periodForm.end_date || null,
        grading_deadline: periodForm.grading_deadline || null,
        lock_after_deadline: Boolean(periodForm.lock_after_deadline),
      }
      if (editingPeriodId) {
        await api.patch(`/api/v1/courses/academic-periods/${editingPeriodId}/`, payload)
        setSuccess('Periodo académico actualizado.')
      } else {
        await api.post('/api/v1/courses/academic-periods/', payload)
        setSuccess('Periodo académico creado.')
      }
      setPeriodForm(createDefaultPeriod())
      setEditingPeriodId(null)
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(
        err,
        editingPeriodId
          ? 'No se pudo actualizar el periodo academico. Verifica fechas, secuencia y estado del periodo.'
          : 'No se pudo crear el periodo academico. Verifica fechas, secuencia y estado del periodo.',
        editingPeriodId ? 'actualizar el periodo academico' : 'crear el periodo academico'
      ))
    } finally {
      setSavingPeriod(false)
    }
  }

  function handleEditPeriod(period) {
    setEditingPeriodId(period.id)
    setPeriodForm(buildPeriodForm(period))
    setError('')
    setSuccess('')
  }

  function handleCancelPeriodEdit() {
    setEditingPeriodId(null)
    setPeriodForm(createDefaultPeriod())
    setError('')
  }

  async function handleClosePeriod(periodId) {
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post(`/api/v1/courses/academic-periods/${periodId}/close/`)
      setSuccess(data?.detail || 'Periodo cerrado correctamente.')
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo cerrar el periodo academico. Verifica que no tenga validaciones pendientes.',
        'cerrar el periodo academico'
      ))
    }
  }

  async function handleCreateSchoolYear(event) {
    event.preventDefault()
    setSavingSchoolYear(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        start_date: schoolYearForm.start_date,
        end_date: schoolYearForm.end_date,
        enrollment_open_date: schoolYearForm.enrollment_open_date,
        enrollment_close_date: schoolYearForm.enrollment_close_date,
        evaluation_type: schoolYearForm.evaluation_type,
        is_active: Boolean(schoolYearForm.is_active),
      }
      await api.post('/api/v1/courses/school-years/', payload)
      setSchoolYearForm(createDefaultSchoolYear())
      setSuccess('Año escolar creado correctamente.')
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo crear el ano escolar. Verifica fechas de inicio, fin y matriculas.',
        'crear el ano escolar'
      ))
    } finally {
      setSavingSchoolYear(false)
    }
  }

  async function handleToggleSchoolYearStatus(schoolYear) {
    setMutatingSchoolYearId(schoolYear.id)
    setError('')
    setSuccess('')

    try {
      const action = schoolYear.is_active ? 'deactivate' : 'activate'
      await api.post(`/api/v1/courses/school-years/${schoolYear.id}/${action}/`)
      setSuccess(schoolYear.is_active ? 'Año escolar desactivado.' : 'Año escolar activado.')
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo actualizar el estado del ano escolar. Revisa si hay periodos o cursos que impidan el cambio.',
        'actualizar el estado del ano escolar'
      ))
    } finally {
      setMutatingSchoolYearId(null)
    }
  }

  async function getSchoolYearDeactivationImpact(schoolYearId) {
    const { data } = await api.get(
      `/api/v1/courses/school-years/${schoolYearId}/deactivation-impact/`
    )
    return data
  }

  return {
    loading,
    error,
    success,
    settings,
    schoolYears,
    periods,
    settingsForm,
    schoolYearForm,
    periodForm,
    editingPeriodId,
    savingSettings,
    savingSchoolYear,
    savingPeriod,
    mutatingSchoolYearId,
    activeSchoolYear,
    setSettingsForm,
    setSchoolYearForm,
    setPeriodForm,
    loadAcademicAdmin,
    handleSaveSettings,
    handleCreateSchoolYear,
    handleToggleSchoolYearStatus,
    getSchoolYearDeactivationImpact,
    handleCreatePeriod,
    handleEditPeriod,
    handleCancelPeriodEdit,
    handleClosePeriod,
  }
}
