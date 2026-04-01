import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  deleteAllCourseNotifications,
  deleteCourseNotification,
  listCourseNotifications,
  markAllCourseNotificationsRead,
  updateCourseNotificationReadState,
} from '../api/notifications'

const NOTIFICATION_TYPE_LABELS = {
  ENROLLMENT: 'Inscripción',
  RESULT_CREATED: 'Resultado',
  RESULT_UPDATED: 'Actualización',
  EXERCISE_CREATED: 'Ejercicio',
}

const NOTIFICATION_TYPE_CLASSNAMES = {
  ENROLLMENT: 'notifications-page__type-badge--enrollment',
  RESULT_CREATED: 'notifications-page__type-badge--result-created',
  RESULT_UPDATED: 'notifications-page__type-badge--result-updated',
  EXERCISE_CREATED: 'notifications-page__type-badge--exercise-created',
}

const getNotificationTypeLabel = (notificationType) => {
  return NOTIFICATION_TYPE_LABELS[notificationType] || 'General'
}

const getNotificationTypeBadgeClassName = (notificationType) => {
  return [
    'notifications-page__type-badge',
    NOTIFICATION_TYPE_CLASSNAMES[notificationType] || 'notifications-page__type-badge--general',
  ].join(' ')
}

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const nextItems = await listCourseNotifications()
      setItems(nextItems)
      
      // Contar las no leídas
      const unreadCount = nextItems.filter((n) => !n.is_read).length
      setUnread(unreadCount)
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function markAll() {
    try {
      await markAllCourseNotificationsRead()
      load()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  async function toggleRead(item) {
    try {
      await updateCourseNotificationReadState(item.id, !item.is_read)
      load()
    } catch (err) {
      console.error('Error toggling read status:', err)
    }
  }

  async function deleteNotification(id) {
    setConfirmDialog({
      title: 'Eliminar notificación',
      message: '¿Estás seguro de que quieres eliminar esta notificación?',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteCourseNotification(id)
          load()
        } catch (err) {
          console.error('Error deleting notification:', err)
        }
      },
    })
  }

  async function deleteAll() {
    setConfirmDialog({
      title: 'Eliminar todas las notificaciones',
      message: '¿Estás seguro de que quieres eliminar TODAS las notificaciones?',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteAllCourseNotifications()
          load()
        } catch (err) {
          console.error('Error deleting all notifications:', err)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="card">
        <div className="notifications-page__loading">
          <div className="spinner" role="status" aria-label="Cargando notificaciones..."></div>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="card notifications-page">
      <div className="notification-header notifications-page__header">
        <div>
          <h1 className="notifications-page__title">Notificaciones</h1>
          <p className="notifications-page__subtitle">
            {unread > 0 ? `Tienes ${unread} notificación${unread > 1 ? 'es' : ''} sin leer` : 'Todas las notificaciones leídas'}
          </p>
        </div>
        <div className="notification-actions notifications-page__actions">
          {unread > 0 && (
            <button className="btn secondary" onClick={markAll}>
              Marcar todas como leídas
            </button>
          )}
          {items.length > 0 && (
            <button className="btn danger" onClick={deleteAll}>
              Eliminar todas
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="notifications-page__empty-state">
          <p className="notifications-page__empty-icon"></p>
          <p className="notifications-page__empty-message">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="table-container notifications-page__table-container">
          <table className="table mobile-card-view notifications-page__table">
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Título</th>
                <th scope="col">Mensaje</th>
                <th scope="col">Fecha</th>
                <th scope="col" className="notifications-page__th-center">Estado</th>
                <th scope="col" className="notifications-page__th-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr
                  key={n.id}
                  className={`notifications-page__row${n.is_read ? '' : ' notifications-page__row--unread'}`}
                >
                  <td data-label="Tipo">
                    <span className={getNotificationTypeBadgeClassName(n.notification_type)}>
                      {getNotificationTypeLabel(n.notification_type)}
                    </span>
                  </td>
                  <td
                    data-label="Título"
                    className={`notifications-page__title-cell${n.is_read ? '' : ' notifications-page__title-cell--unread'}`}
                  >
                    {n.title}
                  </td>
                  <td
                    data-label="Mensaje"
                    className={`notifications-page__message-cell${n.is_read ? '' : ' notifications-page__message-cell--unread'}`}
                  >
                    {n.message}
                  </td>
                  <td data-label="Fecha" className="notifications-page__date-cell">
                    {new Date(n.created_at).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    <br />
                    <span className="notifications-page__time-cell">
                      {new Date(n.created_at).toLocaleTimeString('es', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                  <td data-label="Estado" className="notifications-page__status-cell">
                    <span className={`notifications-page__status-badge${n.is_read ? ' notifications-page__status-badge--read' : ' notifications-page__status-badge--new'}`}>
                      {n.is_read ? 'Leída' : 'Nueva'}
                    </span>
                  </td>
                  <td data-label="Acciones" className="notifications-page__actions-cell">
                    <div className="notifications-page__row-actions">
                      <button 
                        className="btn sm notifications-page__action-btn"
                        onClick={() => toggleRead(n)}
                        aria-label={n.is_read ? 'Marcar como no leída' : 'Marcar como leída'}
                        title={n.is_read ? 'Marcar como no leída' : 'Marcar como leída'}
                      >
                        {n.is_read ? 'No leída' : 'Marcar'}
                      </button>
                      <button 
                        className="btn sm danger notifications-page__action-btn"
                        onClick={() => deleteNotification(n.id)}
                        aria-label={`Eliminar notificación: ${n.message?.substring(0, 60)}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {confirmDialog && (
      <ConfirmDialog
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
    </>
  )
}
