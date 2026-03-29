import React, { useEffect, useState } from 'react'
import { api } from '../api/axios'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

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

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'announcements') {
        const res = await api.get('/api/v1/courses/announcements/')
        setData(res.data)
      } else {
        const res = await api.get('/api/v1/courses/calendar/')
        const institutionalEvents = res.data.filter(e => !e.subject)
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
  }

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

      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ margin: 0 }}>Gestión de Novedades e Institucional</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-xs) 0 0 0' }}>Administra los anuncios generales y eventos institucionales del portal.</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div className="subject-tabs" style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', flex: '1 1 auto', margin: 0 }}>
          <button
            className={`subject-tab ${activeTab === 'announcements' ? 'subject-tab--active' : ''}`}
            onClick={() => setActiveTab('announcements')}
            style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap', margin: 0 }}
          >
            Anuncios Generales
          </button>
          <button
            className={`subject-tab ${activeTab === 'events' ? 'subject-tab--active' : ''}`}
            onClick={() => setActiveTab('events')}
            style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap', margin: 0 }}
          >
            Eventos Institucionales
          </button>
        </div>
        
        <button className="btn primary" onClick={() => openModal()} style={{ whiteSpace: 'nowrap', flex: '0 1 auto' }}>
          Crear {activeTab === 'announcements' ? 'Anuncio' : 'Evento'}
        </button>
      </div>

      {loading && data.length === 0 ? (
        <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="card">
          {data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
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
                    <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => (
                    <tr key={item.id}>
                      <td data-label="Título">
                        <strong style={{ display: 'block' }}>{item.title}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {activeTab === 'announcements' ? 
                           (item.content?.length > 50 ? item.content.substring(0, 50) + '...' : item.content) : 
                           (item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '')}
                        </span>
                      </td>
                      {activeTab === 'announcements' ? (
                        <td data-label="Estado">
                          {item.is_active ? 
                           <span style={{ color: 'var(--success-color, green)', fontWeight: 'bold' }}>Activo</span> : 
                           <span style={{ color: 'var(--text-muted)' }}>Inactivo</span>}
                        </td>
                      ) : (
                        <td data-label="Fechas">
                          {new Date(item.start_time).toLocaleDateString()}
                        </td>
                      )}
                      <td data-label="Acciones">
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => openModal(item)} className="btn secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} aria-label={`Editar ${item.title}`}>
                            Editar
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="btn danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} aria-label={`Eliminar ${item.title}`}>
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        role="dialog"
        aria-modal="true"
        >
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h2 style={{ margin: 0 }}>{editingItem ? 'Editar' : 'Crear'} {activeTab === 'announcements' ? 'Anuncio' : 'Evento'}</h2>
              <button onClick={closeModal} className="btn-close" aria-label="Cerrar modal" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label>Título</label>
                <input 
                  className="input-field" 
                  style={{ width: '100%' }}
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
                      className="input-field" 
                      style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
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
                      className="input-field" 
                      style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)', alignItems: 'end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      <label htmlFor="event-start">Inicio</label>
                      <input 
                        id="event-start"
                        type="datetime-local" 
                        className="input-field" 
                        style={{ width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
                        value={dateStart} 
                        onChange={e => setDateStart(e.target.value)} 
                        required 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      <label htmlFor="event-end">Fin</label>
                      <input 
                        id="event-end"
                        type="datetime-local" 
                        className="input-field" 
                        style={{ width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
                        value={dateEnd} 
                        onChange={e => setDateEnd(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label>Tipo de Evento</label>
                    <select 
                      className="input-field" 
                      style={{ width: '100%' }}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                <button type="button" onClick={closeModal} className="btn secondary" style={{ flex: '1', minWidth: '100px' }}>Cancelar</button>
                <button type="submit" className="btn primary" style={{ flex: '1', minWidth: '100px' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
