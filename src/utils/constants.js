/**
 * Common constants used across the frontend application.
 */

export const API_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión con el servidor. Por favor, revisa tu conexión e inténtalo de nuevo.',
  GENERIC_ERROR: 'Ha ocurrido un error inesperado. Por favor, intenta más tarde.',
  UNAUTHORIZED: 'Credenciales inválidas o sesión expirada.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no se encuentra disponible.',
}

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio.',
  INVALID_EMAIL: 'Ingresa un correo electrónico válido.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
  PASSWORDS_MUST_MATCH: 'Las contraseñas no coinciden.',
}

export const APP_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  SUPPORT_EMAIL: 'soporte@aulaaldia.com',
}

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  TUTOR: 'TUTOR',
}
