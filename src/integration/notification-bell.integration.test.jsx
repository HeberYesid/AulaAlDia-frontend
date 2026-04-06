import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell'
import {
  getCourseNotificationsUnreadCount,
  listCourseNotifications,
  markAllCourseNotificationsRead,
  markCourseNotificationRead,
} from '../api/notifications'

vi.mock('../api/notifications', () => ({
  getCourseNotificationsUnreadCount: vi.fn(),
  listCourseNotifications: vi.fn(),
  markAllCourseNotificationsRead: vi.fn(),
  markCourseNotificationRead: vi.fn(),
}))

function renderNotificationBell() {
  return render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<NotificationBell />} />
        <Route path="/notifications" element={<div>Notifications Page</div>} />
        <Route path="/messages/1" element={<div>Messages Route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('NotificationBell integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getCourseNotificationsUnreadCount.mockResolvedValue(1)
    listCourseNotifications.mockResolvedValue([
      {
        id: 1,
        title: 'Nuevo mensaje',
        message: 'Tienes un mensaje nuevo',
        time_ago: 'hace 1 min',
        is_read: false,
        link: '/messages/1',
      },
    ])
    markAllCourseNotificationsRead.mockResolvedValue({ updated: 1 })
    markCourseNotificationRead.mockResolvedValue({ message: 'ok' })
  })

  it('loads notifications and marks all as read from dropdown', async () => {
    const user = userEvent.setup()
    renderNotificationBell()

    const bellButton = await screen.findByRole('button', {
      name: /notificaciones \(1 no leídas\)/i,
    })

    await user.click(bellButton)

    expect(await screen.findByText('Nuevo mensaje')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /marcar todas leídas/i }))

    await waitFor(() => {
      expect(markAllCourseNotificationsRead).toHaveBeenCalledTimes(1)
      expect(getCourseNotificationsUnreadCount).toHaveBeenCalled()
      expect(listCourseNotifications).toHaveBeenCalled()
    })
  })

  it('marks notification as read and navigates to linked route on click', async () => {
    const user = userEvent.setup()
    renderNotificationBell()

    const bellButton = await screen.findByRole('button', {
      name: /notificaciones \(1 no leídas\)/i,
    })
    await user.click(bellButton)

    await user.click(await screen.findByRole('button', { name: /nuevo mensaje/i }))

    await waitFor(() => {
      expect(markCourseNotificationRead).toHaveBeenCalledWith(1)
    })

    expect(await screen.findByText('Messages Route')).toBeInTheDocument()
  })
})