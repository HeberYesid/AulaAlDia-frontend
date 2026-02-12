import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubjectDetail from '../SubjectDetail'
import { renderWithProviders } from '../../test/utils'
import { api } from '../../api/axios'
import * as router from 'react-router-dom'

// Mock axios
vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(),
  }
})

describe('SubjectDetail Component', () => {
  const mockSubject = {
    id: 1,
    name: 'Mathematics',
    code: 'MATH101',
    description: 'Intro to Math'
  }

  const mockEnrollments = [
    {
      id: 101,
      student: { id: 1, email: 'student@test.com', first_name: 'John', last_name: 'Doe' },
      stats: { grade: 4.5, green: 5, yellow: 1, red: 0, total: 6 }
    }
  ]
  
  const mockDashboard = {
    overview: {
      total_students: 1,
      average_grade: 4.5
    }
  }

  const mockExercises = [
    { id: 1, name: 'Algebra Quiz', deadline: '2026-03-01T10:00:00Z', description: 'Solve equations' }
  ]
  
  const mockResults = [
    { 
      id: 501, 
      student_email: 'student@test.com', 
      exercise_name: 'Algebra Quiz',
      exercise: 1,
      enrollment: 101,
      status: 'GREEN',
      score: 5.0,
      comments: 'Good job'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(router, 'useParams').mockReturnValue({ id: '1' })
    
    // Mock API responses
    api.get.mockImplementation((url) => {
      if (url.includes('/enrollments/')) return Promise.resolve({ data: mockEnrollments })
      if (url.includes('/dashboard/')) return Promise.resolve({ data: mockDashboard })
      if (url.includes('/exercises/')) return Promise.resolve({ data: mockExercises })
      if (url.includes('/results/')) return Promise.resolve({ data: mockResults })
      if (url.includes('/subjects/1')) return Promise.resolve({ data: mockSubject })
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders loading state initially', () => {
    // Override the mock to delay response slightly if needed, 
    // but default behavior simulates async anyway.
    renderWithProviders(<SubjectDetail />)
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('renders subject details after loading', async () => {
    renderWithProviders(<SubjectDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
      expect(screen.getByText('MATH101')).toBeInTheDocument()
    })
  })

  it('displays dashboard stats correctly', async () => {
    renderWithProviders(<SubjectDetail />)
    
    await waitFor(() => {
      // Check for stats cards
      // There are two "1"s in the stats cards (1 Student, 1 Exercise)
      // We can look for the label and then the value associated with it
      expect(screen.getByText('Estudiantes')).toBeInTheDocument()
      expect(screen.getByText('Ejercicios')).toBeInTheDocument()
      // There should be multiple "1"s (index, stats) so getAllByText is safer
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    })
  })

  it('switches tabs and shows results with status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SubjectDetail />)
    
    await waitFor(() => {
      expect(screen.getByText(/Mathematics/i)).toBeInTheDocument()
    })

    // Click on Results tab
    const resultsTab = screen.getByText('Resultados')
    await user.click(resultsTab)
    
    // Check for the result in the table
    // It should show 'GREEN' or '5.0' depending on how StatusBadge renders.
    // StatusBadge acts as a visual component, often rendering text or colors.
    // Assuming it renders "5.0" based on props passed in code: grade={result.status === 'GREEN' ? 5.0 ...}
    // But StatusBadge implementation details matter. 
    // If it renders the text "GREEN", we look for that. If it renders the grade, we look for that.
    // Let's assume it renders the grade passed to it.
    await waitFor(() => {
      const row = screen.getByText('Algebra Quiz').closest('tr')
      expect(within(row).getByText(/5\.0/)).toBeInTheDocument() 
    })
  })
  
  it('handles error when loading fails', async () => {
    // Mock error for subject fetch
    api.get.mockImplementation(() => Promise.reject(new Error('Failed to fetch')))
    
    renderWithProviders(<SubjectDetail />)
    
    await waitFor(() => {
      expect(screen.getByText(/No se pudo cargar/i)).toBeInTheDocument()
    })
  })

  it('allows adding a new exercise', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SubjectDetail />)
    
    await waitFor(() => {
        expect(screen.getByText(/Mathematics/i)).toBeInTheDocument()
    })
    
    // Switch to exercises tab
    // Note: The count is part of the button text: "Ejercicios (1)"
    await user.click(screen.getByText(/Ejercicios \(\d+\)/))
    
    // Click "Crear Ejercicio" button (which opens the form)
    await user.click(screen.getByRole('button', { name: /Crear Ejercicio/i }))
    
    // Fill form
    const nameInput = screen.getByPlaceholderText(/nombre del ejercicio/i)
    await user.type(nameInput, 'New Calc Test')
    
    // Submit (Button inside form also says "Crear Ejercicio" likely, or use type="submit")
    // Use closest form to submit or find the specific button
    // The button inside the form probably says "Crear Ejercicio" as well.
    // Since there are two buttons with similar text (one to open modal/form, one to submit),
    // we need to be careful. The first one disappears if it's replaced by form, 
    // or the form is in a modal/expandable.
    // Code says: `!showExerciseForm ? (button...) : (form...)`
    // So the first button is gone.
    
    api.post.mockResolvedValueOnce({ data: { id: 2, name: 'New Calc Test' } })
    
    const submitBtn = screen.getByRole('button', { name: /Crear Ejercicio/i })
    await user.click(submitBtn)
    
    await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
            '/api/v1/courses/exercises/',
            expect.any(FormData),
            expect.anything()
        )
    })
  })
})
