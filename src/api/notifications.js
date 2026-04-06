import { api } from './axios'
import { API_ENDPOINTS } from './endpoints'
import { unwrapListData } from '../utils/pagination'

export async function listCourseNotifications(params = {}) {
  const { data } = await api.get(API_ENDPOINTS.courses.notifications.base, { params })
  return unwrapListData(data)
}

export async function getCourseNotificationsUnreadCount() {
  const { data } = await api.get(API_ENDPOINTS.courses.notifications.unreadCount)
  return Number(data?.unread_count ?? data?.unread ?? 0)
}

export async function markCourseNotificationRead(notificationId) {
  const { data } = await api.post(
    API_ENDPOINTS.courses.notifications.markRead(notificationId)
  )
  return data
}

export async function markAllCourseNotificationsRead() {
  const { data } = await api.post(API_ENDPOINTS.courses.notifications.markAllRead)
  return data
}

export async function updateCourseNotificationReadState(notificationId, isRead) {
  const { data } = await api.patch(
    API_ENDPOINTS.courses.notifications.byId(notificationId),
    { is_read: isRead }
  )
  return data
}

export async function deleteCourseNotification(notificationId) {
  const { data } = await api.delete(
    API_ENDPOINTS.courses.notifications.byId(notificationId)
  )
  return data
}

export async function deleteAllCourseNotifications() {
  const { data } = await api.post(API_ENDPOINTS.courses.notifications.deleteAll)
  return data
}