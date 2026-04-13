import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import MyTeacherAttendanceHistory from '../MyTeacherAttendanceHistory'

const listMyTeacherAttendanceHistoryMock = vi.fn()

vi.mock('../../hooks/useTeacherAttendance', () => ({
  listMyTeacherAttendanceHistory: (...args) => listMyTeacherAttendanceHistoryMock(...args),
}))

describe('MyTeacherAttendanceHistory page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads teacher history and allows filtering by status', async () => {
    listMyTeacherAttendanceHistoryMock
      .mockResolvedValueOnce([
        {
          id: 31,
          working_date: '2026-04-06',
          check_in_at: '2026-04-06T12:00:00Z',
          check_out_at: '2026-04-06T18:00:00Z',
          status: 'closed',
        },
      ])
      .mockResolvedValueOnce([])

    render(<MyTeacherAttendanceHistory />)

    expect(await screen.findByText('2026-04-06')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'open' } })
    fireEvent.click(screen.getByRole('button', { name: /filtrar/i }))

    await waitFor(() => {
      expect(listMyTeacherAttendanceHistoryMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ status: 'open' })
      )
    })
  })

  it('renders empty message when teacher has no logs', async () => {
    listMyTeacherAttendanceHistoryMock.mockResolvedValue([])

    render(<MyTeacherAttendanceHistory />)

    expect(await screen.findByText(/no tenés registros de asistencia docente todavía/i)).toBeInTheDocument()
  })
})
