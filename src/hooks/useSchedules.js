import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function useSchedules(user) {
  const role = user?.role
  const isAdmin = role === 'ADMIN'
  const isTutor = role === 'TUTOR'
  const isTeacher = role === 'TEACHER'
  const isStudent = role === 'STUDENT'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [timezone, setTimezone] = useState('')
  const [slots, setSlots] = useState([])
  const [emptyState, setEmptyState] = useState(null)
  const [teacherDate, setTeacherDate] = useState(todayISO())
  const [linkedStudents, setLinkedStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [subjects, setSubjects] = useState([])
  const [periods, setPeriods] = useState([])

  const [form, setForm] = useState({
    subject: '',
    academic_period: '',
    day_of_week: 0,
    start_time: '08:00:00',
    end_time: '09:00:00',
  })

  const loadAdminCatalog = useCallback(async () => {
    const [subjectsResponse, periodsResponse] = await Promise.all([
      api.get('/api/v1/courses/subjects/'),
      api.get('/api/v1/courses/academic-periods/'),
    ])

    const nextSubjects = Array.isArray(subjectsResponse?.data) ? subjectsResponse.data : []
    const nextPeriods = Array.isArray(periodsResponse?.data) ? periodsResponse.data : []
    setSubjects(nextSubjects)
    setPeriods(nextPeriods)

    setForm((prev) => ({
      ...prev,
      subject: prev.subject || String(nextSubjects[0]?.id || ''),
      academic_period: prev.academic_period || String(nextPeriods[0]?.id || ''),
    }))
  }, [])

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const { data } = await api.get('/api/v1/courses/schedules/')
        setSlots(Array.isArray(data) ? data : [])
        setEmptyState((Array.isArray(data) && data.length === 0) ? {
          title: 'No hay horario cargado',
          message: 'Aún no hay franjas horarias configuradas para esta institución.',
        } : null)
        setTimezone('')
        return
      }

      if (isTeacher) {
        const { data } = await api.get('/api/v1/courses/schedules/teacher-daily/', {
          params: { date: teacherDate },
        })
        setTimezone(data?.timezone || '')
        setSlots(Array.isArray(data?.slots) ? data.slots : [])
        setEmptyState(data?.empty_state || null)
        return
      }

      if (isStudent || isTutor) {
        const params = {}
        if (isTutor && selectedStudentId) {
          params.student_id = selectedStudentId
        }

        const { data } = await api.get('/api/v1/courses/schedules/student-weekly/', { params })
        setTimezone(data?.timezone || '')
        setSlots(Array.isArray(data?.slots) ? data.slots : [])
        setEmptyState(data?.empty_state || null)

        const nextLinked = Array.isArray(data?.linked_students) ? data.linked_students : []
        setLinkedStudents(nextLinked)
        if (!selectedStudentId && nextLinked.length > 0) {
          setSelectedStudentId(String(data?.student?.id || nextLinked[0]?.id || ''))
        }
      }
    } catch {
      setError('No se pudieron cargar los horarios.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isStudent, isTeacher, isTutor, selectedStudentId, teacherDate])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  useEffect(() => {
    if (!isAdmin) return
    loadAdminCatalog()
  }, [isAdmin, loadAdminCatalog])

  const createSlot = useCallback(async () => {
    if (!isAdmin) return

    setSaving(true)
    setError('')
    try {
      await api.post('/api/v1/courses/schedules/', {
        subject: Number(form.subject),
        academic_period: Number(form.academic_period),
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
      })
      await loadSchedules()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar la franja horaria.')
    } finally {
      setSaving(false)
    }
  }, [form, isAdmin, loadSchedules])

  const canEdit = isAdmin
  const groupedByDay = useMemo(() => {
    return slots.reduce((acc, slot) => {
      const key = Number(slot.day_of_week)
      if (!acc[key]) acc[key] = []
      acc[key].push(slot)
      return acc
    }, {})
  }, [slots])

  return {
    loading,
    saving,
    error,
    timezone,
    slots,
    groupedByDay,
    emptyState,
    linkedStudents,
    selectedStudentId,
    setSelectedStudentId,
    teacherDate,
    setTeacherDate,
    subjects,
    periods,
    form,
    setForm,
    canEdit,
    createSlot,
    reload: loadSchedules,
  }
}
