import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'

export default function Subjects() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data } = await api.get('/api/courses/subjects/')
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/courses/subjects/', { name, code })
      setName('')
      setCode('')
      load()
    } catch (err) {
      setError('No se pudo crear la materia. Verifica que el código sea único.')
    }
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Crear materia</h2>
        <form onSubmit={createSubject}>
          <div>
            <label>Código</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button className="btn" type="submit">Crear</button>
          {error && <p className="notice">{error}</p>}
        </form>
      </div>
      <div className="card">
        <h2>Mis materias</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.code}</td>
                <td>{s.name}</td>
                <td><Link className="link" to={`/subjects/${s.id}`}>Abrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
