import { api } from '../api/axios'

export async function fetchTeacherAttendanceCurrent() {
  const { data } = await api.get('/api/v1/courses/teacher-attendance/current/')
  return data
}

export async function checkInTeacherAttendance() {
  const { data } = await api.post('/api/v1/courses/teacher-attendance/check-in/', {})
  return data
}

export async function checkOutTeacherAttendance() {
  const { data } = await api.post('/api/v1/courses/teacher-attendance/check-out/', {})
  return data
}

export async function listTeacherAttendanceLogs(params = {}) {
  const { data } = await api.get('/api/v1/courses/teacher-attendance/', { params })
  return data
}

export async function listMyTeacherAttendanceHistory(params = {}) {
  const { data } = await api.get('/api/v1/courses/teacher-attendance/my-history/', { params })
  return data
}
