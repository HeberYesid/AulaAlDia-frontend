import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'
import { showPasswordChangeToast } from '../utils/toast'
import { useAuth } from '../state/AuthContext'
import { resetTour } from '../components/AppTour'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../state/ThemeContext'

export default function UserProfile() {
  const { updateUser } = useAuth()
  const { isDark } = useTheme()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

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

  useEffect(() => {
    loadUserProfile()
  }, [])

  async function loadUserProfile() {
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
      setError('No se pudo cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  async function loadTutorInvitationStatus() {
    try {
      const response = await api.get('/api/v1/auth/student-tutor-invitation/')
      setTutorInvitationStatus(response.data)
      setTutorInviteEmail(response.data.pending_invitation?.email || '')
    } catch {
      setTutorInvitationStatus(null)
      setTutorInviteEmail('')
    }
  }

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
      setError(err.response?.data?.detail || 'No se pudo actualizar el perfil')
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
      setError(err.response?.data?.detail || err.response?.data?.current_password?.[0] || 'No se pudo cambiar la contraseña')
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
      setError(err.response?.data?.detail || err.response?.data?.session_timeout?.[0] || 'No se pudo actualizar el timeout')
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
      setSuccess(response.data.message || 'Invitacion enviada correctamente.')
      await loadTutorInvitationStatus()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error inviting tutor:', err)
      setError(err.response?.data?.detail || err.response?.data?.email?.[0] || 'No se pudo enviar la invitacion del acudiente')
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
          <p style={{ color: 'var(--danger)' }}>Error: No se pudo cargar el perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="profile-header" style={{ 
        marginBottom: 'var(--space-xl)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn secondary"
          style={{ padding: '0.5rem 1rem' }}
        >
          ← Volver
        </button>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--font-size-3xl)' }}>
          Mi Perfil
        </h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert success" style={{ marginBottom: 'var(--space-lg)' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="alert error" style={{ marginBottom: 'var(--space-lg)' }}>
          {error}
        </div>
      )}

      {/* Profile Information Card */}
      <div className="card">
        <div className="card-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-xl)',
          paddingBottom: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <h2 style={{ margin: 0 }}>Información Personal</h2>
          {!editing && (
            <button 
              onClick={() => setEditing(true)} 
              className="btn secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Editar
            </button>
          )}
        </div>

        {editing ? (
          // Edit Form
          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
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
                  style={{ 
                    opacity: 0.6, 
                    cursor: 'not-allowed',
                    background: 'var(--bg-primary)'
                  }}
                />
                <p className="notice" style={{ marginTop: '0.5rem' }}>
                  El email no se puede modificar
                </p>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
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
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          // View Mode
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            <div className="profile-info-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 'var(--space-lg)' 
            }}>
              <div style={{
                padding: 'var(--space-lg)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)'
              }}>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--space-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Nombre Completo
                </p>
                <p style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  margin: 0
                }}>
                  {user.first_name} {user.last_name}
                </p>
              </div>

              <div style={{
                padding: 'var(--space-lg)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)'
              }}>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--space-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Email
                </p>
                <p style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  margin: 0
                }}>
                  {user.email}
                </p>
              </div>

              <div style={{
                padding: 'var(--space-lg)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)'
              }}>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--space-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Rol
                </p>
                <p style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  margin: 0
                }}>
                  {user.role === 'TEACHER' ? 'Profesor' : user.role === 'ADMIN' ? 'Administrador' : user.role === 'TUTOR' ? 'Acudiente' : 'Estudiante'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-xl)',
          paddingBottom: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <h2 style={{ margin: 0 }}>Cambiar Contraseña</h2>
          {!changingPassword && (
            <button 
              onClick={() => setChangingPassword(true)} 
              className="btn secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Cambiar
            </button>
          )}
        </div>

        {changingPassword ? (
          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
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

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
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
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{
            padding: 'var(--space-xl)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '3rem', 
              margin: '0 0 var(--space-md) 0' 
            }}>
              
            </p>
            <p style={{ 
              color: 'var(--text-secondary)', 
              margin: 0 
            }}>
              Tu contraseña está segura. Haz clic en "Cambiar" para modificarla.
            </p>
          </div>
        )}
      </div>

      {/* Session Timeout Card */}
      <div className="card">
        <div className="card-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-xl)',
          paddingBottom: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <h2 style={{ margin: 0 }}>Tiempo de Sesión</h2>
          {!editingTimeout && (
            <button 
              onClick={() => setEditingTimeout(true)} 
              className="btn secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Configurar
            </button>
          )}
        </div>

        {editingTimeout ? (
          <form onSubmit={handleUpdateTimeout}>
            <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
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
                <p className="notice" style={{ marginTop: '0.5rem' }}>
                  Tu sesión se cerrará automáticamente después de este tiempo sin actividad (mínimo 5, máximo 120 minutos)
                </p>
              </div>

              <div style={{ 
                padding: 'var(--space-md)', 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-primary)'
              }}>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  <strong>Valores recomendados:</strong>
                </p>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  <li>5-15 minutos: Alta seguridad (dispositivos compartidos)</li>
                  <li>30 minutos: Balance seguridad/comodidad (recomendado)</li>
                  <li>60-120 minutos: Máxima comodidad (dispositivos personales)</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  Guardar
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingTimeout(false)
                    setSessionTimeout(user.session_timeout || 30)
                    setError('')
                  }} 
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{
            padding: 'var(--space-xl)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <p style={{ 
              color: 'var(--text-primary)', 
              margin: '0 0 var(--space-sm) 0',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 600
            }}>
              {user.session_timeout || 30} minutos
            </p>
            <p style={{ 
              color: 'var(--text-secondary)', 
              margin: 0,
              fontSize: 'var(--font-size-sm)'
            }}>
              Tu sesión se cerrará automáticamente después de este tiempo sin actividad
            </p>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Información de la Cuenta</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: 'var(--space-lg)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-primary)',
          fontSize: 'var(--font-size-sm)'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Email Verificado:</span>
          <span style={{ 
            color: user.is_verified ? 'var(--success)' : 'var(--warning)',
            fontWeight: 600
          }}>
            {user.is_verified ? 'Verificado' : 'Pendiente'}
          </span>
        </div>
      </div>

      {user.role === 'STUDENT' && (
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>Invitar Acudiente</h2>
          {tutorInvitationStatus?.has_tutor ? (
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                Ya tienes un acudiente vinculado.
              </p>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                {tutorInvitationStatus.tutor?.name || tutorInvitationStatus.tutor?.email}
                {tutorInvitationStatus.tutor?.email ? ` (${tutorInvitationStatus.tutor.email})` : ''}
              </p>
            </div>
          ) : (
            <form onSubmit={handleInviteTutor}>
              <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                {tutorInvitationStatus?.pending_invitation && (
                  <div style={{
                    padding: 'var(--space-lg)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Invitacion pendiente para {tutorInvitationStatus.pending_invitation.email}
                    </p>
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
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
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Apariencia</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-lg)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
              Tema de la interfaz
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Actualmente: {isDark ? 'Modo oscuro' : 'Modo claro'}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Tour Guide */}
      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Tour de Bienvenida</h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: 'var(--space-lg)',
          fontSize: 'var(--font-size-sm)'
        }}>
          ¿Necesitas ayuda navegando la plataforma? Reinicia el tour interactivo para ver las funcionalidades principales.
        </p>
        <button 
          onClick={() => {
            resetTour(user.role)
            navigate('/')
          }} 
          className="btn secondary"
          style={{ width: '100%' }}
        >
          Reiniciar Tour de Bienvenida
        </button>
      </div>
    </div>
  )
}
