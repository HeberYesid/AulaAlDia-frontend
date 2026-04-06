export const API_ENDPOINTS = Object.freeze({
  auth: {
    tokenRefresh: '/api/v1/auth/token/refresh/',
  },
  courses: {
    notifications: {
      base: '/api/v1/courses/notifications/',
      unreadCount: '/api/v1/courses/notifications/unread-count/',
      markAllRead: '/api/v1/courses/notifications/mark-all-read/',
      deleteAll: '/api/v1/courses/notifications/delete-all/',
      byId: (id) => `/api/v1/courses/notifications/${id}/`,
      markRead: (id) => `/api/v1/courses/notifications/${id}/mark-read/`,
    },
  },
  messaging: {
    conversations: '/api/v1/messaging/conversations/',
    conversationById: (id) => `/api/v1/messaging/conversations/${id}/`,
    startConversation: '/api/v1/messaging/conversations/start/',
    readAll: (conversationId) =>
      `/api/v1/messaging/conversations/${conversationId}/read_all/`,
    messages: '/api/v1/messaging/messages/',
    messagesByConversation: (conversationId) =>
      `/api/v1/messaging/messages/?conversation=${conversationId}`,
    usersSearch: (query) => `/api/v1/messaging/users/?search=${query}`,
  },
})