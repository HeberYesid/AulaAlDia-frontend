import { useState, useRef } from 'react'
import { sendContactMessage } from '../api/contact'
import TurnstileCaptcha from '../components/TurnstileCaptcha'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import '../styles.css'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    // Validación básica
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus({
        type: 'error',
        message: 'Por favor completa todos los campos',
      })
      setIsSubmitting(false)
      return
    }

    // Validar longitud del nombre
    if (formData.name.length > 200) {
      setStatus({
        type: 'error',
        message: 'El nombre no puede exceder 200 caracteres',
      })
      setIsSubmitting(false)
      return
    }

    // Validar formato del nombre (solo letras, espacios, guiones, apóstrofes y acentos)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/
    if (!nameRegex.test(formData.name)) {
      setStatus({
        type: 'error',
        message: 'El nombre solo puede contener letras, espacios y guiones',
      })
      setIsSubmitting(false)
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setStatus({
        type: 'error',
        message: 'Por favor ingresa un correo electrónico válido',
      })
      setIsSubmitting(false)
      return
    }

    // Validar longitud del mensaje
    if (formData.message.trim().length < 10) {
      setStatus({
        type: 'error',
        message: 'El mensaje debe tener al menos 10 caracteres',
      })
      setIsSubmitting(false)
      return
    }

    if (formData.message.length > 2000) {
      setStatus({
        type: 'error',
        message: 'El mensaje no puede exceder 2000 caracteres',
      })
      setIsSubmitting(false)
      return
    }

    // Validar captcha
    if (!turnstileToken) {
      setStatus({
        type: 'error',
        message: 'Por favor completa la verificación de seguridad',
      })
      setIsSubmitting(false)
      return
    }

    // Enviar mensaje al backend
    try {
      const response = await sendContactMessage({
        ...formData,
        turnstile_token: turnstileToken
      })

      setStatus({
        type: 'success',
        message: response.message || '¡Mensaje enviado exitosamente! Te responderemos pronto.',
      })
      
      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
      
      // Resetear captcha
      setTurnstileToken('')
      if (turnstileRef.current) {
        turnstileRef.current.reset()
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      const errorMessage = getApiErrorMessage(error, {
        action: 'enviar tu mensaje de contacto',
        fallback: 'No se pudo enviar tu mensaje de contacto. Revisa los campos del formulario e intentalo nuevamente.',
      })
      
      setStatus({
        type: 'error',
        message: errorMessage,
      })
      
      // Resetear captcha en caso de error
      if (turnstileRef.current) {
        turnstileRef.current.reset()
      }
      setTurnstileToken('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTurnstileVerify = (token) => {
    setTurnstileToken(token)
  }

  const handleTurnstileError = () => {
    setTurnstileToken('')
    setStatus({
      type: 'error',
      message: 'No se pudo completar la verificacion de seguridad. Recarga el captcha e intentalo nuevamente.',
    })
  }

  const handleTurnstileExpire = () => {
    setTurnstileToken('')
  }

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contáctanos</h1>
        <p>¿Tienes preguntas o sugerencias? Nos encantaría escucharte</p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <h2>Información de Contacto</h2>

          <div className="contact-info-item">
            <div className="contact-icon">📧</div>
            <div>
              <h3>Email</h3>
              <p>heberyesiddazatoloza@gmail.com</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-icon">💬</div>
            <div>
              <h3>Soporte</h3>
              <p>Tiempo de respuesta: 24-48 horas</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-icon">🌐</div>
            <div>
              <h3>GitHub</h3>
              <p>
                <a
                  href="https://github.com/HeberYesid/AulaAlDía"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/HeberYesid/AulaAlDía
                </a>
              </p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-icon">📚</div>
            <div>
              <h3>Documentación</h3>
              <p>Consulta nuestra documentación técnica en el repositorio</p>
            </div>
          </div>

          <div className="contact-notice">
            <h3>Antes de contactarnos</h3>
            <p>
              Te recomendamos revisar nuestra sección de{' '}
              <a href="/faq">Preguntas Frecuentes</a> donde podrías encontrar
              respuesta a tu consulta de forma inmediata.
            </p>
          </div>
        </div>

        <div className="contact-form-container">
          <h2>Envíanos un Mensaje</h2>

          {status.message && (
            <div className={`alert alert-${status.type}`}>{status.message}</div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Nombre completo *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Ej: Juan Pérez"
                disabled={isSubmitting}
                maxLength={200}
              />
              <small className="char-counter">
                {formData.name.length}/200 caracteres (solo letras)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Asunto *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Selecciona un asunto</option>
                <option value="soporte">Soporte Técnico</option>
                <option value="registro">Problema con Registro</option>
                <option value="calificaciones">Consulta sobre Calificaciones</option>
                <option value="profesor">Solicitud de Acceso como Profesor</option>
                <option value="bug">Reportar un Error</option>
                <option value="sugerencia">Sugerencia o Mejora</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Mensaje *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe tu consulta o problema…"
                rows="6"
                disabled={isSubmitting}
                maxLength={2000}
              />
              <small className="char-counter">
                {formData.message.length}/2000 caracteres (mínimo 10)
              </small>
            </div>

            <div className="form-group">
              <label id="contact-security-verification-label">Verificación de seguridad *</label>
              <TurnstileCaptcha
                ref={turnstileRef}
                id="contact-security-verification"
                ariaLabelledBy="contact-security-verification-label"
                onVerify={handleTurnstileVerify}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting || !turnstileToken}
            >
              {isSubmitting ? 'Enviando…' : 'Enviar Mensaje'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
