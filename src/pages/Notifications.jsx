import { useEffect, useState } from 'react'
import { api } from '../api/axios'

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [{ data: list }, { data: count }] = await Promise.all([
        api.get('/api/notifs/items/'),
        api.get('/api/notifs/items/unread-count/'),
      ])
      setItems(list)
      setUnread(count.unread)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function markAll() {
    await api.post('/api/notifs/items/mark-all-read/')
    load()
  }

  async function toggleRead(item) {
    await api.patch(`/api/notifs/items/${item.id}/`, { is_read: !item.is_read })
    load()
  }

  if (loading) return <div className="card">Cargando...</div>

  return (
    <div className="card">
      <h2>Notificaciones</h2>
      <p className="notice">No leídas: {unread}</p>
      <button className="btn secondary" onClick={markAll}>Marcar todas como leídas</button>
      <table className="table" style={{ marginTop: '.5rem' }}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Título</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id}>
              <td>{n.type}</td>
              <td>{n.title}</td>
              <td>{n.message}</td>
              <td>{n.is_read ? 'Leída' : 'No leída'}</td>
              <td>
                <button className="btn" onClick={() => toggleRead(n)}>{n.is_read ? 'Marcar no leída' : 'Marcar leída'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
