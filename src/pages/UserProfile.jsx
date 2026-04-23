import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/axios'
import { showPasswordChangeToast } from '../utils/toast'
import { useAuth } from '../state/AuthContext'
import { resetTour } from '../components/AppTour'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../state/ThemeContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import './UserProfile.css'

export default function UserProfile() {
  const { updateUser, logout } = useAuth()
  const { isDark } = useTheme()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Session timeout states
  const [editingTimeout, setEditingTimeout] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [tutorInvitationStatus, setTutorInvitationStatus] = useState(null)
  const [tutorInviteEmail, setTutorInviteEmail] = useState('')
  const [isSubmittingTutorInvite, setIsSubmittingTutorInvite] = useState(false)
  const [highlightTutorSection, setHighlightTutorSection] = useState(false)

  const loadTutorInvitationStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/auth/student-tutor-invitation/')
      setTutorInvitationStatus(response.data)
      setTutorInviteEmail(response.data.pending_invitation?.email || '')
    } catch {
      setTutorInvitationStatus(null)
      setTutorInviteEmail('')
    }
  }, [])

  const loadUserProfile = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/auth/profile/')
      setUser(response.data)
      setFirstName(response.data.first_name)
      setLastName(response.data.last_name)
      setEmail(response.data.email)
      setSessionTimeout(response.data.session_timeout || 30)

      if (response.data.role === 'STUDENT') {
        await loadTutorInvitationStatus()
      } else {
        setTutorInvitationStatus(null)
        setTutorInviteEmail('')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(getApiErrorMessage(err, {
        action: 'cargar tu perfil',
        fallback: 'No se pudo cargar tu perfil. Intentalo nuevamente en unos minutos.',
      }))
    } finally {
      setLoading(false)
    }
  }, [loadTutorInvitationStatus])

  useEffect(() => {
    loadUserProfile()
  }, [loadUserProfile])

  // Mover suavemente hacia la sección si hay un hash en la URL y resaltarla
  useEffect(() => {
    if (!loading && user && location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '')
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          if (id === 'tutor-invite-section') {
            setHighlightTutorSection(true)
            setTimeout(() => setHighlightTutorSection(false), 3000)
          }
        }
      }, 100)
    }
  }, [loading, user, location.hash])

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      const response = await api.patch('/api/v1/auth/profile/', {
        first_name: firstName,
        last_name: lastName
      })
      setUser(response.data)
      setSuccess('Perfil actualizado correctamente')
      setEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(getApiErrorMessage(err, {
        action: 'actualizar tu perfil',
        fallback: 'No se pudo actualizar tu perfil. Verifica nombre y apellido e intentalo de nuevo.',
      }))
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      await api.post('/api/v1/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      })
      
      // Mostrar toast de seguridad
      showPasswordChangeToast()
      
      // Limpiar formulario
      setChangingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Mensaje de éxito temporal
      setSuccess('Contraseña cambiada correctamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error changing password:', err)
      setError(err.response?.data?.current_password?.[0] || getApiErrorMessage(err, {
        action: 'cambiar tu contrasena',
        fallback: 'No se pudo cambiar tu contrasena. Verifica la contrasena actual y los requisitos de seguridad.',
      }))
    }
  }

  async function handleUpdateTimeout(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (sessionTimeout < 5 || sessionTimeout > 120) {
      setError('El timeout debe estar entre 5 y 120 minutos')
      return
    }

    try {
      const response = await api.patch('/api/v1/auth/profile/', {
        session_timeout: sessionTimeout
      })
      setUser(response.data)
      updateUser(response.data) // Actualizar en AuthContext
      setSuccess('Tiempo de sesión actualizado correctamente')
      setEditingTimeout(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating timeout:', err)
      setError(err.response?.data?.session_timeout?.[0] || getApiErrorMessage(err, {
        action: 'actualizar el tiempo de sesion',
        fallback: 'No se pudo actualizar el tiempo de sesion. Debe estar entre 5 y 120 minutos.',
      }))
    }
  }

  async function handleInviteTutor(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!tutorInviteEmail) {
      setError('Debes ingresar el correo del acudiente.')
      return
    }

    setIsSubmittingTutorInvite(true)
    try {
      const response = await api.post('/api/v1/auth/student-tutor-invitation/', {
        email: tutorInviteEmail,
      })

      const invitationCode = response.data?.invitation_code
      const tenantId = response.data?.tenant_id || user?.active_tenant_id || null

      if (invitationCode) {
        const params = new URLSearchParams({ code: invitationCode })
        if (tenantId) {
          params.set('tenant_id', tenantId)
        }
        const registerTutorUrl = `/register-tutor?${params.toString()}`

        await logout()

        // Intentamos navegación SPA y dejamos fallback por si el logout desmonta la vista
        navigate(registerTutorUrl, { replace: true })

        window.setTimeout(() => {
          if (!window.location.pathname.startsWith('/register-tutor')) {
            window.history.replaceState(null, '', registerTutorUrl)
            window.dispatchEvent(new PopStateEvent('popstate'))
          }
        }, 0)

        return
      }

      setSuccess(response.data.message || 'Invitacion enviada correctamente.')
      await loadTutorInvitationStatus()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error inviting tutor:', err)
      setError(err.response?.data?.email?.[0] || getApiErrorMessage(err, {
        action: 'enviar la invitacion al acudiente',
        fallback: 'No se pudo enviar la invitacion al acudiente. Verifica el correo e intentalo nuevamente.',
      }))
    } finally {
      setIsSubmittingTutorInvite(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <span>Cargando perfil...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <p className="user-profile__error-text">Error: No se pudo cargar el perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container user-profile">
      {/* Header */}
      <div className="profile-header user-profile__header">
        <button 
          onClick={() => navigate(-1)} 
          className="btn secondary user-profile__compact-btn"
        >
          ← Volver
        </button>
        <h1 className="user-profile__title">
          Mi Perfil
        </h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert success user-profile__alert">
          {success}
        </div>
      )}
      {error && (
        <div className="alert error user-profile__alert">
          {error}
        </div>
      )}

      {/* Profile Information Card */}
      <div className="card">
        <div className="card-header user-profile__card-header">
          <h2 className="user-profile__section-title">Información Personal</h2>
          {!editing && (
            <button 
              onClick={() => setEditing(true)} 
              className="btn secondary user-profile__compact-btn"
            >
              Editar
            </button>
          )}
        </div>

        {editing ? (
          // Edit Form
          <form onSubmit={handleUpdateProfile}>
            <div className="user-profile__stack">
              <div className="form-group">
                <label htmlFor="profile-first-name"><strong>Nombre</strong></label>
                <input
                  id="profile-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-last-name"><strong>Apellido</strong></label>
                <input
                  id="profile-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-email"><strong>Email</strong></label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  disabled
                  className="user-profile__readonly-input"
                />
                <p className="notice user-profile__notice-top">
                  El email no se puede modificar
                </p>
              </div>

              <div className="user-profile__actions">
                <button type="submit" className="btn user-profile__action-btn">
                  Guardar Cambios
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditing(false)
                    setFirstName(user.first_name)
                    setLastName(user.last_name)
                    setError('')
                  }} 
                  className="btn secondary user-profile__action-btn"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="user-profile__stack">
            <div className="profile-info-grid user-profile__info-grid">
              <div className="user-profile__info-card">
                <p className="user-profile__info-label">
                  Nombre Completo
                </p>
                <p className="user-profile__info-value">
                  {user.first_name} {user.last_name}
                </p>
              </div>

              <div className="user-profile__info-card">
                <p className="user-profile__info-label">
                  Email
                </p>
                <p className="user-profile__info-value">
                  {user.email}
                </p>
              </div>

              <div className="user-profile__info-card">
                <p className="user-profile__info-label">
                  Rol
                </p>
                <p className="user-profile__info-value">
                  {user.role === 'TEACHER' ? 'Profesor' : user.role === 'ADMIN' ? 'Administrador' : user.role === 'TUTOR' ? 'Acudiente' : 'Estudiante'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header user-profile__card-header">
          <h2 className="user-profile__section-title">Cambiar Contraseña</h2>
          {!changingPassword && (
            <button 
              onClick={() => setChangingPassword(true)} 
              className="btn secondary user-profile__compact-btn"
            >
              Cambiar
            </button>
          )}
        </div>

        {changingPassword ? (
          <form onSubmit={handleChangePassword}>
            <div className="user-profile__stack">
              <div className="form-group">
                <label htmlFor="profile-current-password"><strong>Contraseña Actual</strong></label>
                <input
                  id="profile-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-new-password"><strong>Nueva Contraseña</strong></label>
                <input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-confirm-password"><strong>Confirmar Nueva Contraseña</strong></label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>

              <div className="user-profile__actions">
                <button type="submit" className="btn user-profile__action-btn">
                  Cambiar Contraseña
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setChangingPassword(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                  }} 
                  className="btn secondary user-profile__action-btn"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="user-profile__center-panel">
            <p className="user-profile__panel-icon">
              
            </p>
            <p className="user-profile__panel-text">
              Tu contraseña está segura. Haz clic en "Cambiar" para modificarla.
            </p>
          </div>
        )}
      </div>

      {/* Session Timeout Card */}
      <div className="card">
        <div className="card-header user-profile__card-header">
          <h2 className="user-profile__section-title">Tiempo de Sesión</h2>
          {!editingTimeout && (
            <button 
              onClick={() => setEditingTimeout(true)} 
              className="btn secondary user-profile__compact-btn"
            >
              Configurar
            </button>
          )}
        </div>

        {editingTimeout ? (
          <form onSubmit={handleUpdateTimeout}>
            <div className="user-profile__stack">
              <div className="form-group">
                <label htmlFor="profile-session-timeout"><strong>Tiempo de inactividad (minutos)</strong></label>
                <input
                  id="profile-session-timeout"
                  type="number"
                  min="5"
                  max="120"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                  placeholder="30"
                  required
                />
                <p className="notice user-profile__notice-top">
                  Tu sesión se cerrará automáticamente después de este tiempo sin actividad (mínimo 5, máximo 120 minutos)
                </p>
              </div>

              <div className="user-profile__timeout-box">
                <p className="user-profile__timeout-title">
                  <strong>Valores recomendados:</strong>
                </p>
                <ul className="user-profile__timeout-list">
                  <li>5-15 minutos: Alta seguridad (dispositivos compartidos)</li>
                  <li>30 minutos: Balance seguridad/comodidad (recomendado)</li>
                  <li>60-120 minutos: Máxima comodidad (dispositivos personales)</li>
                </ul>
              </div>

              <div className="user-profile__actions">
                <button type="submit" className="btn user-profile__action-btn">
                  Guardar
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingTimeout(false)
                    setSessionTimeout(user.session_timeout || 30)
                    setError('')
                  }} 
                  className="btn secondary user-profile__action-btn"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="user-profile__center-panel">
            <p className="user-profile__timeout-value">
              {user.session_timeout || 30} minutos
            </p>
            <p className="user-profile__timeout-caption">
              Tu sesión se cerrará automáticamente después de este tiempo sin actividad
            </p>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="card">
        <h2 className="user-profile__card-title">Información de la Cuenta</h2>
        <div className="user-profile__account-row">
          <span className="user-profile__account-label">Email Verificado:</span>
          <span className={user.is_verified ? 'user-profile__account-status user-profile__account-status--verified' : 'user-profile__account-status user-profile__account-status--pending'}>
            {user.is_verified ? 'Verificado' : 'Pendiente'}
          </span>
        </div>
      </div>

      {user.role === 'STUDENT' && (
        <div 
          className={`card user-profile__tutor-card ${highlightTutorSection ? 'user-profile__tutor-card--highlight' : ''}`}
          id="tutor-invite-section"
        >
          <h2 className="user-profile__card-title">Invitar Acudiente</h2>
          {tutorInvitationStatus?.has_tutor ? (
            <div className="user-profile__info-card">
              <p className="user-profile__status-title">
                Ya tienes un acudiente vinculado.
              </p>
              <p className="user-profile__status-text">
                {tutorInvitationStatus.tutor?.name || tutorInvitationStatus.tutor?.email}
                {tutorInvitationStatus.tutor?.email ? ` (${tutorInvitationStatus.tutor.email})` : ''}
              </p>
            </div>
          ) : (
            <form onSubmit={handleInviteTutor}>
              <div className="user-profile__stack">
                {tutorInvitationStatus?.pending_invitation && (
                  <div className="user-profile__info-card">
                    <p className="user-profile__status-title">
                      Invitacion pendiente para {tutorInvitationStatus.pending_invitation.email}
                    </p>
                    <p className="user-profile__status-text user-profile__status-text--small">
                      Puedes reenviar la invitacion al mismo correo desde aqui.
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="tutor-invite-email"><strong>Correo del acudiente</strong></label>
                  <input
                    id="tutor-invite-email"
                    type="email"
                    value={tutorInviteEmail}
                    onChange={(event) => setTutorInviteEmail(event.target.value)}
                    placeholder="acudiente@correo.com"
                    required
                  />
                </div>

                <button type="submit" className="btn" disabled={isSubmittingTutorInvite}>
                  {isSubmittingTutorInvite
                    ? 'Enviando invitacion...'
                    : tutorInvitationStatus?.pending_invitation
                      ? 'Reenviar invitacion'
                      : 'Enviar invitacion'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Appearance Card */}
      <div className="card">
        <h2 className="user-profile__card-title">Apariencia</h2>
        <div className="user-profile__appearance-row">
          <div>
            <p className="user-profile__status-title">
              Tema de la interfaz
            </p>
            <p className="user-profile__appearance-caption">
              Actualmente: {isDark ? 'Modo oscuro' : 'Modo claro'}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Tour Guide */}
      <div className="card">
        <h2 className="user-profile__card-title">Tour de Bienvenida</h2>
        <p className="user-profile__tour-text">
          ¿Necesitas ayuda navegando la plataforma? Reinicia el tour interactivo para ver las funcionalidades principales.
        </p>
        <button 
          onClick={() => {
            resetTour(user)
            navigate('/')
          }} 
          className="btn secondary user-profile__full-width-btn"
        >
          Reiniciar Tour de Bienvenida
        </button>
      </div>
    </div>
  )
}
