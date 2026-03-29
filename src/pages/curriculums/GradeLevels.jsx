import React, { useState, useEffect } from 'react'
import { api } from '../../api/axios'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'

export default function GradeLevels() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', order: 1, is_active: true })
  
  useEffect(() => {
    fetchGrades()
  }, [])
  
  const fetchGrades = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/courses/grade-levels/')
      setGrades(res.data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: 'cargar los grados',
        fallback: 'No se pudieron cargar los grados. Verifica tu institucion activa e intentalo nuevamente.',
      }))
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/v1/courses/grade-levels/', formData)
      setIsFormOpen(false)
      setFormData({ name: '', order: 1, is_active: true })
      fetchGrades()
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, {
        action: 'guardar el grado',
        fallback: 'No se pudo guardar el grado. Verifica el nombre y el orden ingresado.',
      }))
    }
  }
  
  if (loading && grades.length === 0) return <div>Cargando grados...</div>
  
  return (
    <div className="card">
      <div className="flex-between mb-4">
        <h2>Gestión de Grados</h2>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : 'Nuevo Grado'}
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded" style={{ borderColor: 'var(--border-color)' }}>
          <div className="form-group">
            <label>Nombre del Grado (ej. 6, 7, 8)</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Orden (para ordenamiento en listas)</label>
            <input 
              type="number" 
              className="form-control" 
              value={formData.order} 
              onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
              required
            />
          </div>
          <div className="form-group flex-between" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
            <label>
              <input 
                type="checkbox" 
                checked={formData.is_active} 
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
              /> Activo
            </label>
          </div>
          <button type="submit" className="btn btn-success mt-2">Guardar</button>
        </form>
      )}
      
      {grades.length === 0 ? (
        <p>No hay grados registrados. Crea el primero.</p>
      ) : (
        <div className="table-container">
          <table className="table mobile-card-view" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Orden</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g.id}>
                  <td data-label="Nombre">{g.name}</td>
                  <td data-label="Orden">{g.order}</td>
                  <td data-label="Estado">
                    <span className={`badge ${g.is_active ? 'badge-success' : 'badge-danger'}`} style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: g.is_active ? 'var(--success)' : 'var(--danger)',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      {g.is_active ? 'Activo' : 'Inactivo'}
                    </span>
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
