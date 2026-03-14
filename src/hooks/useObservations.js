import { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../api/axios'

export const CATEGORIES = [
  { value: 'MISBEHAVIOR', label: 'Mal comportamiento', color: '#ef4444' },
  { value: 'OTHER', label: 'Otro', color: '#6b7280' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

export const INITIAL_FORM = {
  student_email: '',
  subject: '',
  category: 'OTHER',
  title: '',
  description: '',
}

export function useObservations(user) {
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  const loadObservations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/courses/observations/')
      setObservations(res.data)
    } catch (err) {
      console.error('Error loading observations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSubjects = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/courses/subjects/')
      setSubjects(res.data)
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }, [])

  useEffect(() => {
    loadObservations()
    loadSubjects()
  }, [loadObservations, loadSubjects])

  const filteredObservations = useMemo(() => {
    let list = observations
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      list = list.filter(o =>
        (o.student_name && o.student_name.toLowerCase().includes(term)) ||
        (o.student_email_display && o.student_email_display.toLowerCase().includes(term)) ||
        (o.title && o.title.toLowerCase().includes(term)) ||
        (o.teacher_name && o.teacher_name.toLowerCase().includes(term))
      )
    }
    if (categoryFilter) {
      list = list.filter(o => o.category === categoryFilter)
    }
    if (subjectFilter) {
      list = list.filter(o => String(o.subject) === subjectFilter)
    }
    return list
  }, [observations, searchTerm, categoryFilter, subjectFilter])

  const stats = useMemo(() => {
    const total = observations.length
    const byCategory = {}
    for (const c of CATEGORIES) {
      byCategory[c.value] = observations.filter(o => o.category === c.value).length
    }
    return { total, byCategory }
  }, [observations])
  
  const submitObservation = async (payload) => {
    await api.post('/api/v1/courses/observations/', payload)
    loadObservations()
  }
  
  const deleteObservation = async (id) => {
    await api.delete(`/api/v1/courses/observations/${id}/`)
    loadObservations()
  }

  return {
    isTeacherOrAdmin,
    observations,
    loading,
    subjects,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    subjectFilter,
    setSubjectFilter,
    filteredObservations,
    stats,
    submitObservation,
    deleteObservation
  }
}
