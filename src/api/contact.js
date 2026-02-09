import { api } from './axios'

/**
 * Envía un mensaje de contacto al backend
 * @param {Object} data - Datos del formulario de contacto
 * @param {string} data.name - Nombre completo del remitente
 * @param {string} data.email - Email de contacto
 * @param {string} data.subject - Asunto del mensaje
 * @param {string} data.message - Contenido del mensaje
 * @returns {Promise} - Respuesta del servidor
 */
export async function sendContactMessage(data) {
  const response = await api.post('/api/v1/auth/contact/', data)
  return response.data
}
