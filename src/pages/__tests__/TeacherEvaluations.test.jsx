import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import TeacherEvaluations from '../TeacherEvaluations'
import { api } from '../../api/axios'

const mockUseAuth = vi.fn()

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../state/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <TeacherEvaluations />
    </MemoryRouter>,
  )
}

describe('TeacherEvaluations page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders student workflow and submits a new evaluation', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 10, role: 'STUDENT' },
    })

    api.get
      .mockResolvedValueOnce({
        data: {
          options: [
            {
              enrollment_id: 23,
              subject_name: 'Matemáticas',
              subject_code: 'MAT-001',
              teacher_name: 'Ana Docente',
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: { options: [] } })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            subject_name: 'Matemáticas',
            subject_code: 'MAT-001',
            teacher_name: 'Ana Docente',
            overall_score: 4.75,
            clarity_score: 5,
            methodology_score: 4,
            engagement_score: 5,
            respect_score: 5,
            comment: 'Muy buena clase.',
            created_at: '2026-03-31T10:00:00Z',
          },
        ],
      })
    api.post.mockResolvedValueOnce({ data: { id: 1 } })

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /evaluación docente/i })).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText(/materia activa/i), '23')
    await user.clear(screen.getByLabelText(/comentario/i))
    await user.type(screen.getByLabelText(/comentario/i), 'Muy buena clase.')
    await user.click(screen.getByRole('button', { name: /enviar evaluación/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/teacher-evaluations/', {
        enrollment_id: 23,
        clarity_score: 5,
        methodology_score: 5,
        engagement_score: 5,
        respect_score: 5,
        comment: 'Muy buena clase.',
      })
    })

    expect(
      screen.getByText(/el docente solo vera resultados agregados anonimos/i),
    ).toBeInTheDocument()
  })

  it('renders aggregated report for teacher role', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 20, role: 'TEACHER' },
    })

    api.get.mockResolvedValueOnce({
      data: {
        summary: {
          total_responses: 3,
          avg_overall: 4.33,
          avg_clarity: 4.66,
          avg_respect: 4.5,
        },
        results: [
          {
            teacher: { id: 20, name: 'Juan Profe' },
            subject: { code: 'MAT-001', name: 'Matemáticas' },
            metrics: {
              responses_count: 3,
              avg_overall: 4.33,
              avg_clarity: 4.66,
              avg_methodology: 4.0,
              avg_engagement: 4.16,
              avg_respect: 4.5,
            },
            comments: [{ comment: 'Excelente trato.', created_at: '2026-03-31T10:00:00Z' }],
          },
        ],
      },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/resultados agregados por materia/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByRole('article')
    expect(within(reportCard).getByText('Matemáticas')).toBeInTheDocument()
    expect(within(reportCard).getByText('Excelente trato.')).toBeInTheDocument()
    expect(within(reportCard).getByText('Respuestas')).toBeInTheDocument()
    expect(within(reportCard).getByText('3')).toBeInTheDocument()
  })
})
