import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { api } from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = ['#16a34a', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [mine, setMine] = useState([])

  useEffect(() => {
    async function run() {
      setLoading(true)
      try {
        if (user.role === 'TEACHER' || user.role === 'ADMIN') {
          const { data } = await api.get('/api/courses/subjects/')
          setSubjects(data)
        } else {
          const { data } = await api.get('/api/courses/my-enrollments/')
          setMine(data.enrollments || [])
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user])

  if (loading) return <div className="card">Cargando...</div>

  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return (
      <div className="grid cols-2">
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
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td>{s.name}</td>
                  <td><Link className="link" to={`/subjects/${s.id}`}>Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Student dashboard
  const total = mine.reduce((acc, e) => acc + (e.stats?.total || 0), 0)
  const green = mine.reduce((acc, e) => acc + (e.stats?.green || 0), 0)
  const yellow = mine.reduce((acc, e) => acc + (e.stats?.yellow || 0), 0)
  const red = mine.reduce((acc, e) => acc + (e.stats?.red || 0), 0)
  const chartData = [
    { name: 'Verde', value: green },
    { name: 'Amarillo', value: yellow },
    { name: 'Rojo', value: red },
  ]

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Mis materias</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Materia</th>
              <th>Nota</th>
              <th>Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((e) => (
              <tr key={e.enrollment_id}>
                <td>{e.subject_code}</td>
                <td>{e.subject_name}</td>
                <td>{e.stats?.grade?.toFixed?.(2)}</td>
                <td><StatusBadge status={e.stats?.semaphore} grade={e.stats?.grade} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Resumen</h2>
        <PieChart width={320} height={240}>
          <Pie data={chartData} cx={140} cy={110} innerRadius={40} outerRadius={80} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
        <p className="notice">Total ejercicios: {total}</p>
      </div>
    </div>
  )
}
