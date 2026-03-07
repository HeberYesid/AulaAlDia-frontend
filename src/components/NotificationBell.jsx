import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { api } from '../api/axios'

export default function NotificationBell({ sidebarMode = false, collapsed = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const navigate = useNavigate()

  // Load unread count
  async function loadUnreadCount() {
    try {
      const response = await api.get('/api/v1/courses/notifications/unread-count/')
      setUnreadCount(response.data.unread_count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  // Load notifications when dropdown opens
  async function loadNotifications() {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/courses/notifications/')
      setNotifications(response.data.slice(0, 10)) // Only show last 10
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  async function markAsRead(notificationId) {
    try {
      await api.post(`/api/v1/courses/notifications/${notificationId}/mark-read/`)
      loadUnreadCount()
      loadNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // Mark all as read
  async function markAllAsRead() {
    try {
      await api.post('/api/v1/courses/notifications/mark-all-read/')
      loadUnreadCount()
      loadNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  // Handle notification click
  function handleNotificationClick(notification) {
    markAsRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
    }
    setShowDropdown(false)
  }

  // Toggle dropdown
  function toggleDropdown() {
    if (!showDropdown) {
      loadNotifications()
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const PANEL_WIDTH = 380
        const MARGIN = 8
        const vh = window.innerHeight

        if (sidebarMode) {
          // Open to the right of the sidebar
          const left = rect.right + MARGIN
          const spaceBelow = vh - rect.bottom
          const spaceAbove = rect.bottom // bottom of button = space above if we open upward
          const panelMaxHeight = Math.min(520, Math.max(spaceAbove, spaceBelow) - 16)

          if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
            // open downward from button top
            setDropdownStyle({
              position: 'fixed',
              top: Math.max(8, rect.top),
              left,
              bottom: 'auto',
              width: PANEL_WIDTH,
              maxHeight: Math.min(520, vh - rect.top - 16),
            })
          } else {
            // open upward from button bottom
            setDropdownStyle({
              position: 'fixed',
              bottom: vh - rect.bottom,
              left,
              top: 'auto',
              width: PANEL_WIDTH,
              maxHeight: Math.min(520, rect.bottom - 16),
            })
          }
        } else {
          // Standalone mode: open below the button, aligned right
          const right = window.innerWidth - rect.right
          setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + MARGIN,
            right: Math.max(8, right),
            left: 'auto',
            width: PANEL_WIDTH,
            maxHeight: Math.min(520, vh - rect.bottom - MARGIN - 8),
          })
        }
      }
    }
    setShowDropdown(!showDropdown)
  }

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
  }, [showDropdown])

  // Load unread count on mount and poll every 30 seconds
  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }} className="notification-bell">
      {/* Trigger button — sidebar style or standalone style */}
      {sidebarMode ? (
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className={`sidebar__nav-item${showDropdown ? ' sidebar__nav-item--active' : ''}`}
          aria-label={`Notificaciones (${unreadCount} no leídas)`}
          aria-expanded={showDropdown}
          title={collapsed ? 'Notificaciones' : undefined}
          style={{ width: '100%' }}
        >
          <span className="sidebar__nav-icon" style={{ position: 'relative', flexShrink: 0 }}>
            <Bell size={20} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
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
          onClick={toggleDropdown}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            fontSize: '1.5rem',
            color: 'var(--text)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label={`Notificaciones (${unreadCount} no leídas)`}
          aria-expanded={showDropdown}
          title="Notificaciones"
        >
          <Bell size={24} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            ...dropdownStyle,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textDecoration: 'underline'
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <ul role="list" style={{ overflowY: 'auto', flex: 1, background: 'var(--bg-card)', margin: 0, padding: 0, listStyle: 'none' }}>
            {loading ? (
              <li style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner" role="status" aria-label="Cargando notificaciones"></div>
              </li>
            ) : notifications.length === 0 ? (
              <li style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '2rem', margin: 0 }} aria-hidden="true"></p>
                <p>No tienes notificaciones</p>
              </li>
            ) : (
              notifications.map((notification) => (
                <li key={notification.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: notification.is_read ? 'var(--bg-card)' : 'var(--overlay-bg)',
                      transition: 'background 0.2s ease',
                      border: 'none',
                      display: 'block',
                      color: 'inherit',
                      font: 'inherit'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notification.is_read ? 'var(--bg-card)' : 'var(--overlay-bg)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', flex: 1 }}>{notification.title}</strong>
                      {!notification.is_read && (
                        <span
                          aria-hidden="true"
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            marginLeft: '0.5rem',
                            flexShrink: 0
                          }}
                        ></span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {notification.message}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {notification.time_ago}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '0.75rem',
                borderTop: '1px solid var(--border-primary)',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
              }}
            >
              <button
                onClick={() => {
                  navigate('/notifications')
                  setShowDropdown(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
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
