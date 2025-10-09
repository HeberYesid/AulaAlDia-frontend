import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Load unread count
  async function loadUnreadCount() {
    try {
      const response = await api.get('/api/courses/notifications/unread-count/')
      setUnreadCount(response.data.unread_count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  // Load notifications when dropdown opens
  async function loadNotifications() {
    setLoading(true)
    try {
      const response = await api.get('/api/courses/notifications/')
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
      await api.post(`/api/courses/notifications/${notificationId}/mark-read/`)
      loadUnreadCount()
      loadNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // Mark all as read
  async function markAllAsRead() {
    try {
      await api.post('/api/courses/notifications/mark-all-read/')
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
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <button
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
      >
        🔔
        {unreadCount > 0 && (
          <span
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

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '400px',
            maxWidth: '90vw',
            background: '#1e293b',
            border: '2px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '2px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1e293b',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🔔 Notificaciones</h3>
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
          <div style={{ overflowY: 'auto', flex: 1, background: '#1e293b' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '2rem', margin: 0 }}>📭</p>
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #334155',
                    cursor: 'pointer',
                    background: notification.is_read ? '#1e293b' : 'rgba(59, 130, 246, 0.2)',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notification.is_read ? '#1e293b' : 'rgba(59, 130, 246, 0.2)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.95rem', flex: 1 }}>{notification.title}</strong>
                    {!notification.is_read && (
                      <span
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
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '0.75rem',
                borderTop: '2px solid #334155',
                textAlign: 'center',
                background: '#1e293b',
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
