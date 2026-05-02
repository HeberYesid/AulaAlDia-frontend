import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useObservations } from '../useObservations'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('useObservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load observations and subjects on mount and calculate stats', async () => {
    const mockObservations = [{ id: 1, category: 'MISBEHAVIOR', title: 'Test Obs', subject: 'Math' }]
    const mockSubjects = [{ id: 1, name: 'Math' }]

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/observations/') return Promise.resolve({ data: mockObservations })
      if (url === '/api/v1/courses/subjects/') return Promise.resolve({ data: mockSubjects })
      return Promise.resolve({ data: [] })
    })

    const { result } = renderHook(() => useObservations({ role: 'TEACHER' }))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.observations).toEqual(mockObservations)
    expect(result.current.subjects).toEqual(mockSubjects)
    expect(result.current.isTeacherOrAdmin).toBe(true)
    
    // Check computed properties
    expect(result.current.filteredObservations).toEqual(mockObservations)
    expect(result.current.stats.total).toBe(1)
    expect(result.current.stats.byCategory['MISBEHAVIOR']).toBe(1)
    expect(result.current.stats.byCategory['OTHER']).toBe(0)
  })

  it('should filter observations by search term and category correctly', async () => {
    const mockObservations = [
      { id: 1, category: 'MISBEHAVIOR', title: 'Yelling in class' },
      { id: 2, category: 'OTHER', title: 'Missed homework' },
      { id: 3, category: 'MISBEHAVIOR', title: 'Fighting' }
    ]

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/observations/') return Promise.resolve({ data: mockObservations })
      return Promise.resolve({ data: [] })
    })

    const { result } = renderHook(() => useObservations({ role: 'STUDENT' }))

    await waitFor(() => {
      expect(result.current.observations.length).toBe(3)
    })
    
    expect(result.current.isTeacherOrAdmin).toBe(false)

    act(() => {
      result.current.setCategoryFilter('MISBEHAVIOR')
    })

    expect(result.current.filteredObservations.length).toBe(2)
    expect(result.current.filteredObservations[0].id).toBe(1)
    expect(result.current.filteredObservations[1].id).toBe(3)

    act(() => {
      result.current.setSearchTerm('Yelling')
    })

    expect(result.current.filteredObservations.length).toBe(1)
    expect(result.current.filteredObservations[0].id).toBe(1)
  })
})
