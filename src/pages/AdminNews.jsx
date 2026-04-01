import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../api/axios'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import { unwrapListData } from '../utils/pagination'

export default function AdminNews() {
  const [activeTab, setActiveTab] = useState('announcements') // 'announcements' | 'events'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')


  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [eventType, setEventType] = useState('OTHER')
  
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'announcements') {
        const res = await api.get('/api/v1/courses/announcements/')
        setData(unwrapListData(res.data))
      } else {
        const res = await api.get('/api/v1/courses/calendar/')
        const calendarItems = unwrapListData(res.data)
        const institutionalEvents = calendarItems.filter((e) => !e.subject)
        setData(institutionalEvents)
      }
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: 'cargar anuncios y eventos institucionales',
        fallback: 'No se pudo cargar la informacion de anuncios y eventos. Intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openModal(item = null) {
    setError('')
    setSuccess('')
    setEditingItem(item)
    if (item) {
      setTitle(item.title || '')
      if (activeTab === 'announcements') {
        setContent(item.content || '')

      } else {
        setContent(item.description || '')
        setEventType(item.event_type || 'OTHER')
        setDateStart(item.start_time ? new Date(item.start_time).toISOString().slice(0, 16) : '')
        setDateEnd(item.end_time ? new Date(item.end_time).toISOString().slice(0, 16) : '')
      }
    } else {
      setTitle('')
      setContent('')
      setDateStart('')

      setDateEnd('')
      setEventType('OTHER')
    }
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      let payload = {}
      let url = activeTab === 'announcements' ? '/api/v1/courses/announcements/' : '/api/v1/courses/calendar/'
      
      if (activeTab === 'announcements') {
        payload = { title, content, is_active: true }

      } else {
        payload = {
          title,
          description: content,
          start_time: new Date(dateStart).toISOString(),
          end_time: new Date(dateEnd).toISOString(),
          event_type: eventType,
          subject: null
        }
      }

      const method = editingItem ? api.put : api.post
      const fullUrl = editingItem ? `${url}${editingItem.id}/` : url
      
      await method(fullUrl, payload)
      setSuccess('Registro guardado exitosamente.')
      closeModal()
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: editingItem ? 'actualizar el registro' : 'crear el registro',
        fallback: editingItem
          ? 'No se pudo actualizar el registro. Verifica titulo, contenido y fechas.'
          : 'No se pudo crear el registro. Verifica titulo, contenido y fechas.',
      }))
    }
  }

  async function handleDelete(id) {
    setError('')
    setSuccess('')
    try {
      const url = activeTab === 'announcements' ? '/api/v1/courses/announcements/' : '/api/v1/courses/calendar/'
      await api.delete(`${url}${id}/`)
      setSuccess('Registro eliminado exitosamente.')
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: 'eliminar el registro',
        fallback: 'No se pudo eliminar el registro. Verifica permisos e intentalo nuevamente.',
      }))
    }
  }

  function handleDeleteClick(item) {
    setConfirmDelete(item)
  }

  function handleConfirmDelete() {
    const item = confirmDelete
    setConfirmDelete(null)
    handleDelete(item.id)
  }

  return (
    <div className="page-container">
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar registro?"
          message={`¿Estás seguro de que deseas eliminar "${confirmDelete.title}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="page-header admin-news__header">
        <h1 className="admin-news__title">Gestión de Novedades e Institucional</h1>
        <p className="admin-news__subtitle">Administra los anuncios generales y eventos institucionales del portal.</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="admin-news__toolbar">
        <div className="subject-tabs admin-news__tabs">
          <button
            className={`subject-tab admin-news__tab ${activeTab === 'announcements' ? 'subject-tab--active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            Anuncios Generales
          </button>
          <button
            className={`subject-tab admin-news__tab ${activeTab === 'events' ? 'subject-tab--active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Eventos Institucionales
          </button>
        </div>
        
        <button className="btn primary admin-news__create-btn" onClick={() => openModal()}>
          Crear {activeTab === 'announcements' ? 'Anuncio' : 'Evento'}
        </button>
      </div>

      {loading && data.length === 0 ? (
        <div className="admin-news__loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="card">
          {data.length === 0 ? (
            <div className="admin-news__empty">
              No hay {activeTab === 'announcements' ? 'anuncios' : 'eventos'} para mostrar.
            </div>
          ) : (
            <div className="table-container">
              <table className="table mobile-card-view">
                <thead>
                  <tr>
                    <th scope="col">Título</th>
                    {activeTab === 'announcements' ? (
                      <th scope="col">Estado</th>
                    ) : (
                      <th scope="col">Fechas</th>
                    )}
                    <th scope="col" className="admin-news__actions-header">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => (
                    <tr key={item.id}>
                      <td data-label="Título">
                        <strong className="admin-news__row-title">{item.title}</strong>
                        <span className="admin-news__row-preview">
                          {activeTab === 'announcements' ? 
                           (item.content?.length > 50 ? item.content.substring(0, 50) + '...' : item.content) : 
                           (item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '')}
                        </span>
                      </td>
                      {activeTab === 'announcements' ? (
                        <td data-label="Estado">
                          {item.is_active ? 
                           <span className="admin-news__status admin-news__status--active">Activo</span> : 
                           <span className="admin-news__status admin-news__status--inactive">Inactivo</span>}
                        </td>
                      ) : (
                        <td data-label="Fechas">
                          {new Date(item.start_time).toLocaleDateString()}
                        </td>
                      )}
                      <td data-label="Acciones">
                        <div className="admin-news__actions">
                          <button onClick={() => openModal(item)} className="btn secondary admin-news__action-btn" aria-label={`Editar ${item.title}`}>
                            Editar
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="btn danger admin-news__action-btn" aria-label={`Eliminar ${item.title}`}>
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
      )}

      {isModalOpen && (
        <div className="admin-news__modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        role="dialog"
        aria-modal="true"
        >
          <div className="card admin-news__modal-card">
            <div className="admin-news__modal-header">
              <h2 className="admin-news__modal-title">{editingItem ? 'Editar' : 'Crear'} {activeTab === 'announcements' ? 'Anuncio' : 'Evento'}</h2>
              <button onClick={closeModal} className="btn-close admin-news__modal-close" aria-label="Cerrar modal">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-news__form">
              <div>
                <label>Título</label>
                <input 
                  className="input-field admin-news__field-control" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>

              {activeTab === 'announcements' ? (
                <>
                  <div>
                    <label>Contenido</label>
                    <textarea 
                      className="input-field admin-news__field-control admin-news__textarea admin-news__textarea--announcement"
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                      required 
                    />
                  </div>

                </>
              ) : (
                <>
                  <div>
                    <label>Descripción</label>
                    <textarea 
                      className="input-field admin-news__field-control admin-news__textarea admin-news__textarea--description"
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                    />
                  </div>
                  <div className="admin-news__date-grid">
                    <div className="admin-news__date-field">
                      <label htmlFor="event-start">Inicio</label>
                      <input 
                        id="event-start"
                        type="datetime-local" 
                        className="input-field admin-news__datetime-field"
                        value={dateStart} 
                        onChange={e => setDateStart(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="admin-news__date-field">
                      <label htmlFor="event-end">Fin</label>
                      <input 
                        id="event-end"
                        type="datetime-local" 
                        className="input-field admin-news__datetime-field"
                        value={dateEnd} 
                        onChange={e => setDateEnd(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label>Tipo de Evento</label>
                    <select 
                      className="input-field admin-news__field-control"
                      value={eventType} 
                      onChange={e => setEventType(e.target.value)}
                    >
                      <option value="CLASS">Clase</option>
                      <option value="EXAM">Examen</option>
                      <option value="ASSIGNMENT">Entrega de Tarea</option>
                      <option value="EVENT">Evento</option>
                      <option value="MEETING">Reunión</option>
                      <option value="HOLIDAY">Día Feriado</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>
                </>
              )}

              <div className="admin-news__form-actions">
                <button type="button" onClick={closeModal} className="btn secondary admin-news__form-btn">Cancelar</button>
                <button type="submit" className="btn primary admin-news__form-btn">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
