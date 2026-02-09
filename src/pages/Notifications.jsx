import { useEffect, useState } from 'react'
import { api } from '../api/axios'

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      // Usar la misma API que NotificationBell
      const response = await api.get('/api/v1/courses/notifications/')
      setItems(response.data)
      
      // Contar las no leídas
      const unreadCount = response.data.filter(n => !n.is_read).length
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
      await api.post('/api/v1/courses/notifications/mark-all-read/')
      load()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  async function toggleRead(item) {
    try {
      await api.patch(`/api/v1/courses/notifications/${item.id}/`, { is_read: !item.is_read })
      load()
    } catch (err) {
      console.error('Error toggling read status:', err)
    }
  }

  async function deleteNotification(id) {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return
    }
    try {
      await api.delete(`/api/v1/courses/notifications/${id}/`)
      load()
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  async function deleteAll() {
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODAS las notificaciones?')) {
      return
    }
    try {
      await api.post('/api/v1/courses/notifications/delete-all/')
      load()
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h2 style={{ margin: 0 }}>Notificaciones</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
            {unread > 0 ? `Tienes ${unread} notificación${unread > 1 ? 'es' : ''} sin leer` : 'Todas las notificaciones leídas'}
          </p>
        </div>
        <div className="notification-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}></p>
          <p style={{ fontSize: '1.2rem', margin: '1rem 0 0 0' }}>No tienes notificaciones</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table mobile-card-view" style={{ marginTop: '1rem', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Tipo</th>
                <th style={{ width: '200px' }}>Título</th>
                <th>Mensaje</th>
                <th style={{ width: '150px' }}>Fecha</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} style={{ 
                  background: n.is_read ? 'transparent' : 'rgba(var(--primary-rgb, 59, 130, 246), 0.05)',
                  borderLeft: n.is_read ? 'none' : '3px solid var(--primary)'
                }}>
                  <td data-label="Tipo">
                    <span style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: n.notification_type === 'ENROLLMENT' ? '#10b981' :
                                 n.notification_type === 'RESULT_CREATED' ? '#3b82f6' :
                                 n.notification_type === 'RESULT_UPDATED' ? '#f59e0b' :
                                 n.notification_type === 'EXERCISE_CREATED' ? '#8b5cf6' :
                                 '#6b7280',
                      color: 'white',
                      whiteSpace: 'nowrap'
                    }}>
                      {n.notification_type === 'ENROLLMENT' ? 'Inscripción' :
                       n.notification_type === 'RESULT_CREATED' ? 'Resultado' :
                       n.notification_type === 'RESULT_UPDATED' ? 'Actualización' :
                       n.notification_type === 'EXERCISE_CREATED' ? 'Ejercicio' : 'General'}
                    </span>
                  </td>
                  <td data-label="Título" style={{ 
                    fontWeight: n.is_read ? 'normal' : '600',
                    fontSize: '0.9rem'
                  }}>
                    {n.title}
                  </td>
                  <td data-label="Mensaje" style={{ 
                    fontSize: '0.85rem',
                    color: n.is_read ? 'var(--text-secondary)' : 'var(--text)'
                  }}>
                    {n.message}
                  </td>
                  <td data-label="Fecha" style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {new Date(n.created_at).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    <br />
                    <span style={{ fontSize: '0.75rem' }}>
                      {new Date(n.created_at).toLocaleTimeString('es', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                  <td data-label="Estado" style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: n.is_read ? '#e5e7eb' : 'var(--primary)',
                      color: n.is_read ? '#6b7280' : 'white',
                      whiteSpace: 'nowrap'
                    }}>
                      {n.is_read ? 'Leída' : 'Nueva'}
                    </span>
                  </td>
                  <td data-label="Acciones" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn sm"
                        onClick={() => toggleRead(n)}
                        title={n.is_read ? 'Marcar como no leída' : 'Marcar como leída'}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          minWidth: 'auto'
                        }}
                      >
                        {n.is_read ? 'No leída' : 'Marcar'}
                      </button>
                      <button 
                        className="btn sm danger"
                        onClick={() => deleteNotification(n.id)}
                        title="Eliminar notificación"
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          minWidth: 'auto'
                        }}
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
  )
}
