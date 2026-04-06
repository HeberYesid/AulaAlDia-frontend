import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import AdminTeacherAttendance from '../AdminTeacherAttendance'

const listTeacherAttendanceLogsMock = vi.fn()

vi.mock('../../hooks/useTeacherAttendance', () => ({
  listTeacherAttendanceLogs: (...args) => listTeacherAttendanceLogsMock(...args),
}))

describe('AdminTeacherAttendance page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads logs and allows filtering by status', async () => {
    listTeacherAttendanceLogsMock
      .mockResolvedValueOnce([
        {
          id: 11,
          teacher: { full_name: 'Ana Docente', email: 'ana@example.com' },
          working_date: '2026-04-05',
          check_in_at: '2026-04-05T08:00:00Z',
          check_out_at: null,
          status: 'open',
        },
      ])
      .mockResolvedValueOnce([])

    render(<AdminTeacherAttendance />)

    expect(await screen.findByText(/ana docente/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'closed' } })
    fireEvent.click(screen.getByRole('button', { name: /filtrar/i }))

    await waitFor(() => {
      expect(listTeacherAttendanceLogsMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ status: 'closed' })
      )
    })
  })

  it('renders empty message when no logs exist', async () => {
    listTeacherAttendanceLogsMock.mockResolvedValue([])

    render(<AdminTeacherAttendance />)

    expect(await screen.findByText(/sin registros de asistencia docente/i)).toBeInTheDocument()
  })
})
