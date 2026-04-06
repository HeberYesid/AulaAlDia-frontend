import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Clock, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { listCourseNotifications } from '../api/notifications'

const ROLE_LABEL = {
  STUDENT: 'Estudiante',
  TEACHER: 'Profesor',
  ADMIN: 'Administrador',
  TUTOR: 'Acudiente',
}

const NOTIF_TYPE_ICON = {
  ENROLLMENT_CREATED: '📋',
  RESULTS_UPDATED: '📊',
  REPORT_READY: '📄',
  NEW_MESSAGE: '💬',
  GENERAL: '🔔',
}

function formatDateTime(isoString) {
  if (!isoString) return null
  const d = new Date(isoString)
  const date = d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const time = d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} a las ${time}`
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return `Hace ${Math.floor(diff / 86400)} d`
}

export default function WelcomePanel() {
  const { user, lastLoginAt, lastLoginIp } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const items = await listCourseNotifications({ limit: 5 })
      setNotifications(items.slice(0, 5))
      setUnreadCount(items.filter((notification) => !notification.is_read).length)
    } catch {
      // keep silent to avoid noisy UX in dashboard
    }
  }, [])

  useEffect(() => {
    loadNotifications()

    const intervalId = setInterval(loadNotifications, 15000)
    const handleFocus = () => loadNotifications()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadNotifications])

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = ROLE_LABEL[user?.role] || user?.role
  const formattedLastLogin = formatDateTime(lastLoginAt)

  return (
    <div className="welcome-panel">
      {/* Greeting + role */}
      <div className="welcome-panel__greeting">
        <div className="welcome-panel__greeting-text">
          <h1 className="welcome-panel__title">¡Bienvenido, {firstName}!</h1>
          <span className="welcome-panel__role-badge">{roleLabel}</span>
        </div>
        <time className="welcome-panel__date" dateTime={new Date().toISOString()}>
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>

      {/* Last login info */}
      <div className="welcome-panel__last-login">
        <div className="welcome-panel__last-login-item">
          <Clock size={15} strokeWidth={2} className="welcome-panel__meta-icon" />
          {formattedLastLogin ? (
            <span>Último acceso: <strong>{formattedLastLogin}</strong></span>
          ) : (
            <span>Esta es tu primera sesión en AulaAlDía. ¡Bienvenido!</span>
          )}
        </div>
        {lastLoginIp && (
          <div className="welcome-panel__last-login-item">
            <MapPin size={15} strokeWidth={2} className="welcome-panel__meta-icon" />
            <span>Desde IP: <strong>{lastLoginIp}</strong></span>
          </div>
        )}
      </div>

      {/* Notifications panel */}
      <div className="welcome-panel__notifs">
        <div className="welcome-panel__notifs-header">
          <div className="welcome-panel__notifs-title">
            <Bell size={16} strokeWidth={2} />
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <span className="welcome-panel__unread-badge">{unreadCount}</span>
            )}
          </div>
          <Link to="/notifications" className="welcome-panel__see-all">
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        {notifications.length === 0 ? (
          <div className="welcome-panel__notifs-empty">
            <CheckCircle2 size={20} className="welcome-panel__empty-icon" />
            <span>No tienes notificaciones recientes</span>
          </div>
        ) : (
          <ul className="welcome-panel__notifs-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`welcome-panel__notif-item${n.is_read ? '' : ' welcome-panel__notif-item--unread'}`}
              >
                {(n.link || n.link_url) ? (
                  <Link to={(n.link || n.link_url)} className="welcome-panel__notif-link">
                    <span className="welcome-panel__notif-icon" aria-hidden="true">
                      {NOTIF_TYPE_ICON[n.notification_type || n.type] ?? '🔔'}
                    </span>
                    <div className="welcome-panel__notif-body">
                      <span className="welcome-panel__notif-title">{n.title}</span>
                      {n.message && (
                        <span className="welcome-panel__notif-msg">{n.message}</span>
                      )}
                    </div>
                    <span className="welcome-panel__notif-time">{timeAgo(n.created_at)}</span>
                  </Link>
                ) : (
                  <div className="welcome-panel__notif-link">
                    <span className="welcome-panel__notif-icon" aria-hidden="true">
                      {NOTIF_TYPE_ICON[n.notification_type || n.type] ?? '🔔'}
                    </span>
                    <div className="welcome-panel__notif-body">
                      <span className="welcome-panel__notif-title">{n.title}</span>
                      {n.message && (
                        <span className="welcome-panel__notif-msg">{n.message}</span>
                      )}
                    </div>
                    <span className="welcome-panel__notif-time">{timeAgo(n.created_at)}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
