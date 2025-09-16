import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="brand"><Link to="/">DevTrack</Link></div>
      <nav>
        {user ? (
          <>
            {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
              <Link to="/subjects">Materias</Link>
            )}
            {user.role === 'STUDENT' && (
              <Link to="/my">Mis resultados</Link>
            )}
            <Link to="/notifications">Notificaciones</Link>
            <span className="user">{user.email} ({user.role})</span>
            <button onClick={onLogout} className="btn">Salir</button>
          </>
        ) : (
          <>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Registrarse</Link>
          </>
        )}
      </nav>
    </header>
  )
}
