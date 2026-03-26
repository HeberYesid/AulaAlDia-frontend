import React, { useState, useEffect } from 'react'
import { api } from '../../api/axios'

export default function Curriculums() {
  const [curriculums, setCurriculums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', scope_type: 'TENANT_DEFAULT', is_active: true })
  
  useEffect(() => {
    fetchCurriculums()
  }, [])
  
  const fetchCurriculums = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/courses/curriculums/')
      setCurriculums(res.data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Error al cargar las mallas curriculares.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/v1/courses/curriculums/', formData)
      setIsFormOpen(false)
      setFormData({ name: '', scope_type: 'TENANT_DEFAULT', is_active: true })
      fetchCurriculums()
    } catch (err) {
      console.error(err)
      alert('Error al guardar la malla.')
    }
  }

  const handleClone = async (id) => {
    const gradeLevel = prompt("Ingrese el ID del Grado destino:");
    if (!gradeLevel) return;
    
    try {
      await api.post(`/api/v1/courses/curriculums/${id}/clone-to-grade/`, {
        grade_level_id: gradeLevel
      });
      alert('Malla clonada exitosamente.');
      fetchCurriculums();
    } catch (err) {
      console.error(err);
      alert('Error al clonar la malla.');
    }
  }

  const handleUnlink = async (id) => {
    if (!window.confirm("¿Está seguro de desvincular esta malla? El grado volverá a usar la malla por defecto.")) return;
    
    try {
      await api.delete(`/api/v1/courses/curriculums/${id}/`);
      alert('Malla desvinculada exitosamente.');
      fetchCurriculums();
    } catch (err) {
      console.error(err);
      alert('Error al desvincular la malla.');
    }
  }

  
  if (loading && curriculums.length === 0) return <div>Cargando mallas...</div>
  
  return (
    <div className="card">
      <div className="flex-between mb-4">
        <h2>Gestión de Mallas Curriculares</h2>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : 'Nueva Malla'}
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded" style={{ borderColor: 'var(--border-color)' }}>
          <div className="form-group">
            <label>Nombre de la Malla</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Alcance</label>
            <select 
              className="form-control"
              value={formData.scope_type}
              onChange={e => setFormData({...formData, scope_type: e.target.value})}
            >
              <option value="TENANT_DEFAULT">Global (Institución)</option>
              <option value="GRADE">Por Grado</option>
              <option value="COURSE">Por Curso</option>
            </select>
          </div>
          <div className="form-group flex-between" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
            <label>
              <input 
                type="checkbox" 
                checked={formData.is_active} 
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
              /> Activa
            </label>
          </div>
          <button type="submit" className="btn btn-success mt-2">Guardar</button>
        </form>
      )}
      
      {curriculums.length === 0 ? (
        <p>No hay mallas registradas.</p>
      ) : (
        <div className="table-container">
          <table className="table mobile-card-view" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Alcance</th>
                <th>Por defecto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {curriculums.map(c => (
                <tr key={c.id}>
                  <td data-label="Nombre">{c.name}</td>
                  <td data-label="Alcance">{c.scope_type}</td>
                  <td data-label="Por defecto">{c.is_default ? 'Sí' : 'No'}</td>
                  <td data-label="Estado">
                    <span className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`} style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: c.is_active ? 'var(--success)' : 'var(--danger)',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      {c.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    {c.scope_type === 'TENANT_DEFAULT' && (
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleClone(c.id)}
                      >
                        Clonar para Grado
                      </button>
                    )}
                    {c.scope_type === 'GRADE' && (
                      <button 
                        className="btn btn-sm btn-danger ml-2"
                        onClick={() => handleUnlink(c.id)}
                      >
                        Desvincular (Volver a Default)
                      </button>
                    )}
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
