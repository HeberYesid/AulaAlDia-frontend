import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import {
  getCourseNotificationsUnreadCount,
  listCourseNotifications,
  markAllCourseNotificationsRead,
  markCourseNotificationRead,
} from '../api/notifications'

const PANEL_MAX_WIDTH = 380
const PANEL_MAX_HEIGHT = 520
const PANEL_MARGIN = 8
const PANEL_OPEN_DOWNWARD_THRESHOLD = 200
const MIN_PANEL_HEIGHT = 180
const UNREAD_COUNT_POLL_INTERVAL_MS = 60000

function resolveNotificationLink(notification) {
  return notification.link || notification.link_url || null
}

function getBadgeLabel(unreadCount) {
  return unreadCount > 9 ? '9+' : unreadCount
}

function buildDropdownStyle(buttonRect, sidebarMode) {
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const width = Math.min(PANEL_MAX_WIDTH, Math.max(240, viewportWidth - PANEL_MARGIN * 2))

  if (sidebarMode) {
    const preferredLeft = buttonRect.right + PANEL_MARGIN
    const left = Math.min(
      Math.max(PANEL_MARGIN, preferredLeft),
      Math.max(PANEL_MARGIN, viewportWidth - width - PANEL_MARGIN),
    )

    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const openDownward = (
      spaceBelow >= PANEL_OPEN_DOWNWARD_THRESHOLD
      || spaceBelow >= spaceAbove
    )

    if (openDownward) {
      const top = Math.max(PANEL_MARGIN, buttonRect.top)
      return {
        position: 'fixed',
        top,
        left,
        bottom: 'auto',
        width,
        maxHeight: Math.min(
          PANEL_MAX_HEIGHT,
          Math.max(MIN_PANEL_HEIGHT, viewportHeight - top - PANEL_MARGIN),
        ),
      }
    }

    const bottom = Math.max(PANEL_MARGIN, viewportHeight - buttonRect.bottom)
    return {
      position: 'fixed',
      bottom,
      left,
      top: 'auto',
      width,
      maxHeight: Math.min(
        PANEL_MAX_HEIGHT,
        Math.max(MIN_PANEL_HEIGHT, buttonRect.bottom - PANEL_MARGIN),
      ),
    }
  }

  const right = Math.max(PANEL_MARGIN, viewportWidth - buttonRect.right)
  const top = buttonRect.bottom + PANEL_MARGIN
  return {
    position: 'fixed',
    top,
    right,
    left: 'auto',
    width,
    maxHeight: Math.min(
      PANEL_MAX_HEIGHT,
      Math.max(MIN_PANEL_HEIGHT, viewportHeight - top - PANEL_MARGIN),
    ),
  }
}

export default function NotificationBell({ sidebarMode = false, collapsed = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const navigate = useNavigate()

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getCourseNotificationsUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const items = await listCourseNotifications()
      setNotifications(items.slice(0, 10))
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markCourseNotificationRead(notificationId)
      await Promise.all([loadUnreadCount(), loadNotifications()])
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [loadNotifications, loadUnreadCount])

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllCourseNotificationsRead()
      await Promise.all([loadUnreadCount(), loadNotifications()])
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [loadNotifications, loadUnreadCount])

  const handleNotificationClick = useCallback((notification) => {
    void markAsRead(notification.id)
    const targetLink = resolveNotificationLink(notification)
    if (targetLink) {
      navigate(targetLink)
    }
    setShowDropdown(false)
  }, [markAsRead, navigate])

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return

    setDropdownStyle(
      buildDropdownStyle(buttonRef.current.getBoundingClientRect(), sidebarMode),
    )
  }, [sidebarMode])

  const handleToggleDropdown = useCallback(() => {
    setShowDropdown((current) => {
      if (!current) {
        void loadNotifications()
        updateDropdownPosition()
      }

      return !current
    })
  }, [loadNotifications, updateDropdownPosition])

  const handleViewAll = useCallback(() => {
    navigate('/notifications')
    setShowDropdown(false)
  }, [navigate])

  const badgeLabel = getBadgeLabel(unreadCount)

  // Recalculate dropdown position while it is open
  useEffect(() => {
    if (!showDropdown) return undefined

    const reposition = () => {
      updateDropdownPosition()
    }

    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)

    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [showDropdown, updateDropdownPosition])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [showDropdown])

  // Load unread count on mount and poll while the page is visible
  useEffect(() => {
    const refreshUnreadCount = () => {
      if (document.visibilityState !== 'visible') return
      void loadUnreadCount()
    }

    refreshUnreadCount()
    const interval = window.setInterval(refreshUnreadCount, UNREAD_COUNT_POLL_INTERVAL_MS)

    window.addEventListener('focus', refreshUnreadCount)
    document.addEventListener('visibilitychange', refreshUnreadCount)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshUnreadCount)
      document.removeEventListener('visibilitychange', refreshUnreadCount)
    }
  }, [loadUnreadCount])

  // Toggle dropdown
  function getSidebarTriggerClasses() {
    return [
      'sidebar__nav-item',
      'notification-bell__trigger',
      'notification-bell__trigger--sidebar',
      showDropdown ? 'sidebar__nav-item--active' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div ref={dropdownRef} className="notification-bell">
      {/* Trigger button — sidebar style or standalone style */}
      {sidebarMode ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggleDropdown}
          className={getSidebarTriggerClasses()}
          aria-label={`Notificaciones (${unreadCount} no leídas)`}
          aria-expanded={showDropdown}
          title={collapsed ? 'Notificaciones' : undefined}
        >
          <span className="sidebar__nav-icon notification-bell__icon-wrapper">
            <Bell size={20} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="notification-bell__badge notification-bell__badge--sidebar"
              >
                {badgeLabel}
              </span>
            )}
          </span>
          {!collapsed && (
            <span className="sidebar__nav-label">Notificaciones</span>
          )}
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggleDropdown}
          className="notification-bell__trigger notification-bell__trigger--standalone"
          aria-label={`Notificaciones (${unreadCount} no leídas)`}
          aria-expanded={showDropdown}
          title="Notificaciones"
        >
          <Bell size={24} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="notification-bell__badge notification-bell__badge--standalone"
            >
              {badgeLabel}
            </span>
          )}
        </button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="notification-bell__dropdown" style={dropdownStyle}>
          {/* Header */}
          <div className="notification-bell__header">
            <h3 className="notification-bell__title">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="notification-bell__mark-all"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <ul role="list" className="notification-bell__list">
            {loading ? (
              <li className="notification-bell__state">
                <div className="spinner" role="status" aria-label="Cargando notificaciones"></div>
              </li>
            ) : notifications.length === 0 ? (
              <li className="notification-bell__state notification-bell__state--empty">
                <p className="notification-bell__empty-icon" aria-hidden="true"></p>
                <p>No tienes notificaciones</p>
              </li>
            ) : (
              notifications.map((notification) => (
                <li key={notification.id} className="notification-bell__item">
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={[
                      'notification-bell__item-button',
                      !notification.is_read ? 'notification-bell__item-button--unread' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <div className="notification-bell__item-head">
                      <strong className="notification-bell__item-title">{notification.title}</strong>
                      {!notification.is_read && (
                        <span aria-hidden="true" className="notification-bell__item-dot"></span>
                      )}
                    </div>
                    <p className="notification-bell__item-message">
                      {notification.message}
                    </p>
                    <p className="notification-bell__item-time">
                      {notification.time_ago}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-bell__footer">
              <button
                type="button"
                onClick={handleViewAll}
                className="notification-bell__view-all"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
