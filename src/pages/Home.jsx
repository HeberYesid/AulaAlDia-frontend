import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import '../styles.css'

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Bienvenido a DevTrack</h1>
        <p className="hero-subtitle">
          Sistema de seguimiento académico para estudiantes y profesores
        </p>
        <div className="hero-buttons">
          {isAuthenticated ? (
            <Link to="/" className="btn btn-primary">
              Ir al Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <h2>Características principales</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Gestión de Asignaturas</h3>
            <p>
              Organiza y administra todas tus asignaturas en un solo lugar.
              Profesores pueden crear y gestionar materias fácilmente.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Seguimiento de Resultados</h3>
            <p>
              Registra y visualiza el progreso de los estudiantes en tiempo real.
              Sistema de calificación automático con indicadores visuales.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✍️</div>
            <h3>Ejercicios y Evaluaciones</h3>
            <p>
              Crea ejercicios, asigna tareas y evalúa el desempeño de los
              estudiantes con sistema de estados (Verde, Amarillo, Rojo).
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Notificaciones en Tiempo Real</h3>
            <p>
              Mantente informado con notificaciones sobre inscripciones,
              resultados y actualizaciones importantes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📤</div>
            <h3>Importación CSV</h3>
            <p>
              Carga masiva de estudiantes y resultados mediante archivos CSV
              para agilizar el proceso de gestión.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Roles y Permisos</h3>
            <p>
              Sistema de roles (Estudiante, Profesor, Administrador) con
              permisos específicos para cada nivel de acceso.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>¿Listo para comenzar?</h2>
        <p>Únete a DevTrack y lleva el seguimiento académico al siguiente nivel</p>
        <div className="cta-buttons">
          {!isAuthenticated && (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Crear Cuenta
              </Link>
              <Link to="/register-teacher" className="btn btn-secondary btn-lg">
                Registro de Profesor
              </Link>
            </>
          )}
          <Link to="/faq" className="btn btn-outline">
            Preguntas Frecuentes
          </Link>
        </div>
      </section>
    </div>
  )
}
