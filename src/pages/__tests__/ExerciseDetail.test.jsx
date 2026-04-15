import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ExerciseDetailPage from '../ExerciseDetail'
import { api } from '../../api/axios'

const useAuthMock = vi.fn()

vi.mock('../../state/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../api/axios', () => ({
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  setApiActiveTenantId: vi.fn(),
}))

function renderPage(path = '/subjects/10/exercises/20') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/subjects/:subjectId/exercises/:exerciseId" element={<ExerciseDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExerciseDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockReset()
    api.post.mockReset()
  })

  it('renders teacher submissions section for teacher role', async () => {
    useAuthMock.mockReturnValue({ user: { role: 'TEACHER', email: 'teacher@test.com' } })

    api.get
      .mockResolvedValueOnce({ data: { id: 10, name: 'Matemáticas', code: 'MAT10' } })
      .mockResolvedValueOnce({
        data: {
          id: 20,
          name: 'Taller 1',
          description: 'Resolver problemas',
          deadline: '2026-03-10T08:00:00Z',
          deadline_status: 'UPCOMING',
          attachment_download_url: '/api/v1/courses/exercises/20/download-attachment/',
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            student_email: 'student@test.com',
            student_name: 'Student Test',
            score: 4.5,
            status: 'SUBMITTED',
            submission_download_url: '/api/v1/courses/results/1/download-submission/',
            updated_at: '2026-03-09T12:00:00Z',
            comment: 'Buen trabajo',
          },
        ],
      })

    renderPage()

    expect(await screen.findByText('Taller 1')).toBeInTheDocument()
    expect(screen.getByText(/Entregas de estudiantes/i)).toBeInTheDocument()
    expect(screen.getByText('Student Test')).toBeInTheDocument()
  })

  it('renders student section and submits solution', async () => {
    useAuthMock.mockReturnValue({ user: { role: 'STUDENT', email: 'student@test.com' } })

    api.get
      .mockResolvedValueOnce({ data: { id: 10, name: 'Matemáticas', code: 'MAT10' } })
      .mockResolvedValueOnce({
        data: {
          id: 20,
          name: 'Taller 1',
          description: 'Resolver problemas',
          deadline: '2026-03-10T08:00:00Z',
          deadline_status: 'OVERDUE',
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            student_email: 'student@test.com',
            score: null,
            status: 'SUBMITTED',
            comment: 'Recibido',
            submission_download_url: '/api/v1/courses/results/1/download-submission/',
          },
        ],
      })

    api.post.mockResolvedValueOnce({ data: { ok: true } })
    // reload after submit
    api.get
      .mockResolvedValueOnce({ data: { id: 10, name: 'Matemáticas', code: 'MAT10' } })
      .mockResolvedValueOnce({
        data: {
          id: 20,
          name: 'Taller 1',
          description: 'Resolver problemas',
          deadline: '2026-03-10T08:00:00Z',
          deadline_status: 'OVERDUE',
        },
      })
      .mockResolvedValueOnce({ data: [] })

    renderPage()

    expect(await screen.findByText(/Tu entrega/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Vencido/i).length).toBeGreaterThan(0)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Respuesta en texto/i), 'Mi solución final')
    await user.click(screen.getByRole('button', { name: /Reenviar solución|Enviar solución/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/courses/exercises/20/submit/',
        expect.any(FormData),
        expect.anything()
      )
    })
  })

  it('shows error state when load fails', async () => {
    useAuthMock.mockReturnValue({ user: { role: 'STUDENT', email: 'student@test.com' } })
    api.get.mockRejectedValueOnce(new Error('boom'))

    renderPage()

    expect(await screen.findByText(/No se pudo cargar el detalle del ejercicio/i)).toBeInTheDocument()
  })
})
