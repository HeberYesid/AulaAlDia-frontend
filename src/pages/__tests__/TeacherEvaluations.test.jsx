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
    patch: vi.fn(),
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

  it('renders student workflow and submits a dynamic evaluation', async () => {
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
              questions: [
                { id: 1, prompt: 'Claridad al explicar', question_type: 'SCALE_1_5', is_required: true },
                { id: 2, prompt: 'Metodología', question_type: 'SCALE_1_5', is_required: true },
                { id: 3, prompt: 'Comentario general', question_type: 'TEXT', is_required: false },
              ],
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
            overall_score: 4.5,
            responses: [
              {
                question_id: 1,
                prompt: 'Claridad al explicar',
                question_type: 'SCALE_1_5',
                numeric_score: 5,
                text_answer: '',
              },
              {
                question_id: 2,
                prompt: 'Metodología',
                question_type: 'SCALE_1_5',
                numeric_score: 4,
                text_answer: '',
              },
              {
                question_id: 3,
                prompt: 'Comentario general',
                question_type: 'TEXT',
                numeric_score: null,
                text_answer: 'Muy buena clase.',
              },
            ],
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
    await user.clear(screen.getByLabelText(/comentario general/i))
    await user.type(screen.getByLabelText(/comentario general/i), 'Muy buena clase.')
    await user.click(screen.getByRole('button', { name: /enviar evaluación/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/teacher-evaluations/', {
        enrollment_id: 23,
        answers: [
          { question_id: 1, numeric_score: 5, text_answer: '' },
          { question_id: 2, numeric_score: 5, text_answer: '' },
          { question_id: 3, numeric_score: null, text_answer: 'Muy buena clase.' },
        ],
      })
    })

    expect(
      screen.getByText(/el docente solo verá resultados agregados anónimos/i),
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
        },
        results: [
          {
            teacher: { id: 20, name: 'Juan Profe' },
            subject: { code: 'MAT-001', name: 'Matemáticas' },
            metrics: {
              responses_count: 3,
              avg_overall: 4.33,
            },
            question_metrics: [
              {
                question_id: 1,
                prompt: 'Claridad al explicar',
                avg_score: 4.66,
                responses_count: 3,
              },
            ],
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
    expect(within(reportCard).getByText('Claridad al explicar')).toBeInTheDocument()
  })

  it('allows admin to create and toggle questions', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 30, role: 'ADMIN' },
    })

    api.get
      .mockResolvedValueOnce({
        data: {
          summary: { total_responses: 0, avg_overall: 0 },
          results: [],
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            code: 'clarity',
            prompt: 'Claridad al explicar',
            question_type: 'SCALE_1_5',
            is_required: true,
            is_active: true,
            display_order: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            code: 'clarity',
            prompt: 'Claridad al explicar',
            question_type: 'SCALE_1_5',
            is_required: true,
            is_active: true,
            display_order: 1,
          },
          {
            id: 2,
            code: '',
            prompt: '¿Te sentiste acompañado?',
            question_type: 'TEXT',
            is_required: false,
            is_active: true,
            display_order: 2,
          },
        ],
      })
      .mockResolvedValueOnce({ data: { options: [] } })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            code: 'clarity',
            prompt: 'Claridad al explicar',
            question_type: 'SCALE_1_5',
            is_required: true,
            is_active: false,
            display_order: 1,
          },
          {
            id: 2,
            code: '',
            prompt: '¿Te sentiste acompañado?',
            question_type: 'TEXT',
            is_required: false,
            is_active: true,
            display_order: 2,
          },
        ],
      })
      .mockResolvedValueOnce({ data: { options: [] } })
      .mockResolvedValueOnce({ data: [] })

    api.post.mockResolvedValueOnce({ data: { id: 2 } })
    api.patch.mockResolvedValueOnce({ data: { id: 1, is_active: false } })

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/configuración de preguntas/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/^pregunta$/i), '¿Te sentiste acompañado?')
    await user.selectOptions(screen.getByLabelText(/tipo/i), 'TEXT')
    await user.click(screen.getByRole('button', { name: /crear pregunta/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/teacher-evaluation-questions/', {
        prompt: '¿Te sentiste acompañado?',
        help_text: '',
        question_type: 'TEXT',
        is_required: true,
        is_active: true,
      })
    })

    const deactivateButtons = screen.getAllByRole('button', { name: /desactivar/i })
    await user.click(deactivateButtons[0])

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/teacher-evaluation-questions/1/', {
        is_active: false,
      })
    })
  })
})
