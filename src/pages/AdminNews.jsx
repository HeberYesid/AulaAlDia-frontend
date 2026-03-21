import React, { useEffect, useState } from 'react'
import { api } from '../api/axios'
import { Plus, Edit2, Trash2, Calendar, Megaphone, X } from 'lucide-react'

export default function AdminNews() {
  const [activeTab, setActiveTab] = useState('announcements') // 'announcements' | 'events'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('') // announcement body
  const [isActive, setIsActive] = useState(true)

  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [eventType, setEventType] = useState('OTHER')

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    try {
      if (activeTab === 'announcements') {
        const res = await api.get('/api/v1/courses/announcements/')
        setData(res.data)
      } else {
        const res = await api.get('/api/v1/courses/calendar/')
        // Filter out event subjects if we only want institutional context, 
        // but for now let's just show those created without a subject (Institutional)
        // or all. Let's just show events that have no subject.
        const institutionalEvents = res.data.filter(e => !e.subject)
        setData(institutionalEvents)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openModal(item = null) {
    setEditingItem(item)
    if (item) {
      setTitle(item.title || '')
      if (activeTab === 'announcements') {
        setContent(item.content || '')
        setIsActive(item.is_active !== false)
      } else {
        setContent(item.description || '')
        setEventType(item.event_type || 'OTHER')
        setDateStart(item.start_time ? new Date(item.start_time).toISOString().slice(0, 16) : '')
        setDateEnd(item.end_time ? new Date(item.end_time).toISOString().slice(0, 16) : '')
      }
    } else {
      setTitle('')
      setContent('')
      setIsActive(true)
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
    try {
      let payload = {}
      let url = activeTab === 'announcements' ? '/api/v1/courses/announcements/' : '/api/v1/courses/calendar/'
      
      if (activeTab === 'announcements') {
        payload = { title, content, is_active: isActive }
      } else {
        payload = {
          title,
          description: content,
          start_time: new Date(dateStart).toISOString(),
          end_time: new Date(dateEnd).toISOString(),
          event_type: eventType,
          subject: null // Institutional event
        }
      }

      if (editingItem) {
        await api.put(`${url}${editingItem.id}/`, payload)
      } else {
        await api.post(url, payload)
      }
      closeModal()
      loadData()
    } catch (err) {
      console.error(err)
      alert("Ocurrió un error al guardar.")
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) return
    try {
      const url = activeTab === 'announcements' ? '/api/v1/courses/announcements/' : '/api/v1/courses/calendar/'
      await api.delete(`${url}${id}/`)
      loadData()
    } catch (err) {
      console.error(err)
      alert("Error al eliminar.")
    }
  }

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="page-container p-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary-500" />
            Gestión de Novedades e Institucional
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Administra los anuncios generales y eventos institucionales del portal.
          </p>
        </div>
        <button 
          onClick={() => openModal()}
          className="mt-4 md:mt-0 btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear {activeTab === 'announcements' ? 'Anuncio' : 'Evento'}
        </button>
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg flex items-center gap-2 ${
                activeTab === 'announcements' 
                  ? 'text-primary-600 border-primary-600 dark:text-primary-500 dark:border-primary-500' 
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('announcements')}
            >
              <Megaphone className="w-4 h-4" /> Anuncios Generales
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg flex items-center gap-2 ${
                activeTab === 'events' 
                  ? 'text-primary-600 border-primary-600 dark:text-primary-500 dark:border-primary-500' 
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('events')}
            >
              <Calendar className="w-4 h-4" /> Eventos Institucionales
            </button>
          </li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300">
            No hay registros para mostrar.
          </div>
        )}
        
        {data.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative group">
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                  {item.title}
                </h3>
              </div>
              {activeTab === 'announcements' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {item.content}
                  </p>
                  <div className="flex justify-between items-center mt-4 text-xs font-medium">
                    <span className={`px-2 py-1 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {item.description || 'Sin descripción'}
                  </p>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p><strong>Inicio:</strong> {new Date(item.start_time).toLocaleString()}</p>
                    <p><strong>Fin:</strong> {new Date(item.end_time).toLocaleString()}</p>
                    <p><strong>Tipo:</strong> {item.event_type}</p>
                  </div>
                </>
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded shadow px-1 py-1">
              <button onClick={() => openModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Editar' : 'Crear'} {activeTab === 'announcements' ? 'Anuncio' : 'Evento'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input 
                  required
                  type="text"
                  className="input-field w-full"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {activeTab === 'announcements' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contenido</label>
                    <textarea 
                      required
                      className="input-field w-full min-h-[100px]"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Anuncio activo (visible en sidebar)</label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea 
                      className="input-field w-full"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Inicio</label>
                      <input 
                        required
                        type="datetime-local"
                        className="input-field w-full"
                        value={dateStart}
                        onChange={e => setDateStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fin</label>
                      <input 
                        required
                        type="datetime-local"
                        className="input-field w-full"
                        value={dateEnd}
                        onChange={e => setDateEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Evento</label>
                    <select 
                      className="input-field w-full"
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                    >
                      <option value="OTHER">Otro</option>
                      <option value="CLASS">Clase</option>
                      <option value="EXAM">Exámen</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
