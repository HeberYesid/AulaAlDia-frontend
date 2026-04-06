import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../api/axios'
import {
  checkInTeacherAttendance,
  checkOutTeacherAttendance,
  fetchTeacherAttendanceCurrent,
  listTeacherAttendanceLogs,
} from '../useTeacherAttendance'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('useTeacherAttendance API helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches current teacher attendance status', async () => {
    api.get.mockResolvedValue({ data: { has_open_shift: true, shift: { id: 10 } } })

    const data = await fetchTeacherAttendanceCurrent()

    expect(api.get).toHaveBeenCalledWith('/api/v1/courses/teacher-attendance/current/')
    expect(data.has_open_shift).toBe(true)
    expect(data.shift.id).toBe(10)
  })

  it('posts check-in and check-out actions', async () => {
    api.post
      .mockResolvedValueOnce({ data: { result: 'created' } })
      .mockResolvedValueOnce({ data: { result: 'closed' } })

    const checkInData = await checkInTeacherAttendance()
    const checkOutData = await checkOutTeacherAttendance()

    expect(api.post).toHaveBeenNthCalledWith(1, '/api/v1/courses/teacher-attendance/check-in/', {})
    expect(api.post).toHaveBeenNthCalledWith(2, '/api/v1/courses/teacher-attendance/check-out/', {})
    expect(checkInData.result).toBe('created')
    expect(checkOutData.result).toBe('closed')
  })

  it('lists teacher attendance logs with params', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1 }] })

    const data = await listTeacherAttendanceLogs({ teacher_id: 4, status: 'open' })

    expect(api.get).toHaveBeenCalledWith('/api/v1/courses/teacher-attendance/', {
      params: { teacher_id: 4, status: 'open' },
    })
    expect(data).toEqual([{ id: 1 }])
  })
})
