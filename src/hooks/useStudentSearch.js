import { useState, useEffect } from 'react'
import { api } from '../api/axios'

export function useStudentSearch(initialValue = '', enabled = true) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => {
    const trimmedSearch = searchTerm.trim()

    if (!enabled || trimmedSearch.length < 2) {
      setOptions([])
      if (loading) setLoading(false)
      return undefined
    }

    if (selectedStudent && trimmedSearch === selectedStudent.full_name) {
      setOptions([])
      if (loading) setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    const timeoutId = setTimeout(async () => {
      try {
        // Usa la misma API o una más genérica si existe.
        const response = await api.get('/api/v1/courses/observations/student-options/', {
          params: { search: trimmedSearch },
        })
        if (!cancelled) {
          setOptions(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error searching students:', err)
          setOptions([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [searchTerm, selectedStudent, enabled])

  return {
    searchTerm,
    setSearchTerm,
    options,
    loading,
    selectedStudent,
    setSelectedStudent,
    clearSearch: () => {
      setSearchTerm('')
      setOptions([])
      setSelectedStudent(null)
    }
  }
}
