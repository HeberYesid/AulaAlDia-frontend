import { useState, useCallback } from 'react'
import { api } from '../api/axios'

export const DEFAULT_SETTINGS = {
  period_scheme: 'TRIMESTER',
  min_grade: '1.00',
  max_grade: '5.00',
  passing_grade: '3.00',
  lock_grades_after_deadline: true,
  active_grading_scale: null,
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

export const DEFAULT_SCALE = {
  name: '',
  description: '',
  is_active: false,
  ranges: [
    { label: 'Superior', min_value: '4.60', max_value: '5.00', order: 1 },
    { label: 'Alto', min_value: '4.00', max_value: '4.59', order: 2 },
    { label: 'Básico', min_value: '3.00', max_value: '3.99', order: 3 },
    { label: 'Bajo', min_value: '0.00', max_value: '2.99', order: 4 },
  ],
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

export function normalizeApiError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail

  const firstEntry = Object.values(error?.response?.data || {})[0]
  if (Array.isArray(firstEntry) && firstEntry[0]) return firstEntry[0]
  if (typeof firstEntry === 'string' && firstEntry.trim()) return firstEntry

  return fallback
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

export function createDefaultScale() {
  return {
    name: '',
    description: '',
    is_active: false,
    ranges: [
      { label: 'Superior', min_value: '4.60', max_value: '5.00', order: 1 },
      { label: 'Alto', min_value: '4.00', max_value: '4.59', order: 2 },
      { label: 'Básico', min_value: '3.00', max_value: '3.99', order: 3 },
      { label: 'Bajo', min_value: '0.00', max_value: '2.99', order: 4 },
    ],
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

export function buildScaleForm(scale) {
  return {
    name: scale.name || '',
    description: scale.description || '',
    is_active: Boolean(scale.is_active),
    ranges: (scale.ranges || []).map((range, index) => ({
      id: range.id,
      label: range.label,
      min_value: String(range.min_value),
      max_value: String(range.max_value),
      order: Number(range.order || index + 1),
    })),
  }
}

export function useAcademicSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [periods, setPeriods] = useState([])
  const [scales, setScales] = useState([])
  const [schoolYears, setSchoolYears] = useState([])
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS)
  const [periodForm, setPeriodForm] = useState(DEFAULT_PERIOD)
  const [scaleForm, setScaleForm] = useState(DEFAULT_SCALE)
  const [schoolYearForm, setSchoolYearForm] = useState(DEFAULT_SCHOOL_YEAR)
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [editingScaleId, setEditingScaleId] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [savingScale, setSavingScale] = useState(false)
  const [savingSchoolYear, setSavingSchoolYear] = useState(false)
  const [mutatingSchoolYearId, setMutatingSchoolYearId] = useState(null)
  const activeSchoolYear = schoolYears.find((schoolYear) => schoolYear.is_active) || null

  const loadAcademicAdmin = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [settingsResult, periodsResult, scalesResult, schoolYearsResult] = await Promise.all([
        api.get('/api/v1/courses/academic-settings/'),
        api.get('/api/v1/courses/academic-periods/'),
        api.get('/api/v1/courses/grading-scales/'),
        api.get('/api/v1/courses/school-years/'),
      ])

      const nextSettings = settingsResult.data || DEFAULT_SETTINGS
      const nextPeriods = periodsResult.data?.results || periodsResult.data || []
      const nextScales = scalesResult.data?.results || scalesResult.data || []
      const nextSchoolYears = schoolYearsResult.data?.results || schoolYearsResult.data || []

      setSettings(nextSettings)
      setSettingsForm({
        period_scheme: nextSettings.period_scheme || 'TRIMESTER',
        min_grade: String(nextSettings.min_grade ?? '1.00'),
        max_grade: String(nextSettings.max_grade ?? '5.00'),
        passing_grade: String(nextSettings.passing_grade ?? '3.00'),
        lock_grades_after_deadline: Boolean(nextSettings.lock_grades_after_deadline),
        active_grading_scale: nextSettings.active_grading_scale,
      })
      setPeriods(Array.isArray(nextPeriods) ? nextPeriods : [])
      setScales(Array.isArray(nextScales) ? nextScales : [])
      setSchoolYears(Array.isArray(nextSchoolYears) ? nextSchoolYears : [])
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo cargar la configuración académica.'))
    } finally {
      setLoading(false)
    }
  }, [])

  function updateScaleRange(index, field, value) {
    setScaleForm((current) => ({
      ...current,
      ranges: current.ranges.map((range, rangeIndex) => (
        rangeIndex === index ? { ...range, [field]: value } : range
      )),
    }))
  }

  function addScaleRange() {
    setScaleForm((current) => ({
      ...current,
      ranges: [
        ...current.ranges,
        { label: '', min_value: '', max_value: '', order: current.ranges.length + 1 },
      ],
    }))
  }

  function removeScaleRange(index) {
    setScaleForm((current) => ({
      ...current,
      ranges: current.ranges
        .filter((_, rangeIndex) => rangeIndex !== index)
        .map((range, rangeIndex) => ({ ...range, order: rangeIndex + 1 })),
    }))
  }

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
        active_grading_scale: settingsForm.active_grading_scale || null,
      }
      const { data } = await api.patch('/api/v1/courses/academic-settings/', payload)
      setSettings(data)
      setSettingsForm({
        period_scheme: data.period_scheme,
        min_grade: String(data.min_grade),
        max_grade: String(data.max_grade),
        passing_grade: String(data.passing_grade),
        lock_grades_after_deadline: Boolean(data.lock_grades_after_deadline),
        active_grading_scale: data.active_grading_scale,
      })
      setSuccess('Configuración académica actualizada.')
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo actualizar la configuración académica.'))
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

    const activeSchoolYearStart = Number(String(activeSchoolYear?.start_date || '').slice(0, 4))
    if (!editingPeriodId && !Number.isFinite(activeSchoolYearStart)) {
      setError('No se pudo determinar el año del periodo desde el año escolar activo.')
      return
    }

    const periodYear = editingPeriodId ? Number(periodForm.year) : activeSchoolYearStart
    if (!Number.isFinite(periodYear)) {
      setError('No se pudo determinar el año del periodo.')
      return
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
      setError(normalizeApiError(err, editingPeriodId ? 'No se pudo actualizar el periodo académico.' : 'No se pudo crear el periodo académico.'))
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
      setError(normalizeApiError(err, 'No se pudo cerrar el periodo académico.'))
    }
  }

  async function handleCreateScale(event) {
    event.preventDefault()
    setSavingScale(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...scaleForm,
        ranges: scaleForm.ranges.map((range, index) => ({
          ...(range.id ? { id: range.id } : {}),
          ...range,
          order: Number(range.order || index + 1),
          min_value: Number(range.min_value),
          max_value: Number(range.max_value),
        })),
      }
      if (editingScaleId) {
        await api.patch(`/api/v1/courses/grading-scales/${editingScaleId}/`, payload)
        setSuccess('Escala de valoración actualizada.')
      } else {
        await api.post('/api/v1/courses/grading-scales/', payload)
        setSuccess('Escala de valoración creada.')
      }
      setScaleForm(createDefaultScale())
      setEditingScaleId(null)
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(err, editingScaleId ? 'No se pudo actualizar la escala de valoración.' : 'No se pudo crear la escala de valoración.'))
    } finally {
      setSavingScale(false)
    }
  }

  function handleEditScale(scale) {
    setEditingScaleId(scale.id)
    setScaleForm(buildScaleForm(scale))
    setError('')
    setSuccess('')
  }

  function handleCancelScaleEdit() {
    setEditingScaleId(null)
    setScaleForm(createDefaultScale())
    setError('')
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
      setError(normalizeApiError(err, 'No se pudo crear el año escolar.'))
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
      setError(normalizeApiError(err, 'No se pudo actualizar el estado del año escolar.'))
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
    scales,
    settingsForm,
    schoolYearForm,
    periodForm,
    scaleForm,
    editingPeriodId,
    editingScaleId,
    savingSettings,
    savingSchoolYear,
    savingPeriod,
    savingScale,
    mutatingSchoolYearId,
    activeSchoolYear,
    setSettingsForm,
    setSchoolYearForm,
    setPeriodForm,
    setScaleForm,
    loadAcademicAdmin,
    updateScaleRange,
    addScaleRange,
    removeScaleRange,
    handleSaveSettings,
    handleCreateSchoolYear,
    handleToggleSchoolYearStatus,
    getSchoolYearDeactivationImpact,
    handleCreatePeriod,
    handleEditPeriod,
    handleCancelPeriodEdit,
    handleClosePeriod,
    handleCreateScale,
    handleEditScale,
    handleCancelScaleEdit,
  }
}
