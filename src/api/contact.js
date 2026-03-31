import { api } from './axios'

/**
 * Envía un mensaje de contacto al backend
 * @param {Object} data - Datos del formulario de contacto
 * @param {string} data.name - Nombre completo del remitente
 * @param {string} data.email - Email de contacto
 * @param {string} data.subject - Asunto del mensaje
 * @param {string} data.message - Contenido del mensaje
 * @param {boolean} data.legal_acceptance - Confirmacion de tratamiento de datos
 * @returns {Promise} - Respuesta del servidor
 */
export async function sendContactMessage(data) {
  const response = await api.post('/api/v1/auth/contact/', data)
  return response.data
}

/**
 * Registra un lead en la waitlist publica de la landing.
 * @param {Object} data - Datos del formulario de waitlist
 * @param {string} data.name - Nombre de la persona interesada
 * @param {string} data.email - Correo para seguimiento
 * @returns {Promise} - Respuesta del servidor
 */
export async function joinWaitlist(data) {
  const response = await api.post('/api/v1/auth/waitlist/', data)
  return response.data
}
