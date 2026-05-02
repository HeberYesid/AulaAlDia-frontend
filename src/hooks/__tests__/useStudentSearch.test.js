import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStudentSearch } from '../useStudentSearch'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn()
  }
}))

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('useStudentSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useStudentSearch())
    
    expect(result.current.searchTerm).toBe('')
    expect(result.current.options).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('should not search if search term is less than 2 characters', async () => {
    const { result } = renderHook(() => useStudentSearch())
    
    act(() => {
      result.current.setSearchTerm('a')
    })

    await act(async () => {
      await delay(300)
    })

    expect(api.get).not.toHaveBeenCalled()
    expect(result.current.options).toEqual([])
  })

  it('should perform search after debounce when search term is >= 2 chars', async () => {
    const mockData = [{ id: 1, full_name: 'John Doe' }]
    api.get.mockResolvedValueOnce({ data: mockData })

    const { result } = renderHook(() => useStudentSearch())
    
    act(() => {
      result.current.setSearchTerm('John')
    })

    expect(result.current.loading).toBe(true)

    // Wait for debounce and api call
    await act(async () => {
      await delay(350)
    })

    await waitFor(() => {
      expect(result.current.options).toEqual(mockData)
      expect(result.current.loading).toBe(false)
    })

    expect(api.get).toHaveBeenCalledWith('/api/v1/courses/observations/student-options/', {
      params: { search: 'John' }
    })
  })

  it('should not search if search term matches the selected student name', async () => {
    const { result } = renderHook(() => useStudentSearch())
    
    act(() => {
      result.current.setSelectedStudent({ id: 1, full_name: 'Jane Doe' })
      result.current.setSearchTerm('Jane Doe')
    })

    await act(async () => {
      await delay(300)
    })

    expect(api.get).not.toHaveBeenCalled()
  })

  it('should clear search completely when clearSearch is called', () => {
    const { result } = renderHook(() => useStudentSearch())
    
    act(() => {
      result.current.setSearchTerm('Jane')
      result.current.setSelectedStudent({ id: 1, full_name: 'Jane Doe' })
    })

    act(() => {
      result.current.clearSearch()
    })

    expect(result.current.searchTerm).toBe('')
    expect(result.current.options).toEqual([])
    expect(result.current.selectedStudent).toBeNull()
  })
})
