const FIELD_LABELS = {
  email: 'correo',
  student_email: 'correo del estudiante',
  invitation_code: 'codigo de invitacion',
  turnstile_token: 'verificacion de seguridad',
  password: 'contrasena',
  current_password: 'contrasena actual',
  new_password: 'nueva contrasena',
  session_timeout: 'tiempo de sesion',
}

const GENERIC_MESSAGE_PATTERNS = [
  /^error(\b|$)/i,
  /ha ocurrido un error/i,
  /ocurrio un error/i,
  /ocurrio un error inesperado/i,
  /something went wrong/i,
  /intentalo de nuevo/i,
  /try again/i,
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function toSentence(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function isUnsafeTechnicalMessage(message) {
  const text = String(message || '').trim()
  if (!text) return false

  const lowered = text.toLowerCase()
  const looksLikeHtmlDocument =
    lowered.startsWith('<!doctype html') ||
    lowered.startsWith('<html') ||
    (/<\/?[a-z][^>]*>/i.test(text) && /<(html|head|body|title|style|script|table|tr|td|h1)\b/i.test(lowered))

  if (looksLikeHtmlDocument) return true

  return (
    lowered.includes('traceback (most recent call last)') ||
    lowered.includes('request method:') ||
    lowered.includes('request url:') ||
    lowered.includes('using the urlconf defined in')
  )
}

function humanizeFieldName(field) {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field]
  return field.replace(/_/g, ' ')
}

function getMessageFromFieldValue(field, value) {
  if (Array.isArray(value) && value.length > 0) {
    return `${humanizeFieldName(field)}: ${String(value[0])}`
  }

  if (typeof value === 'string' && value.trim()) {
    return `${humanizeFieldName(field)}: ${value.trim()}`
  }

  if (value && typeof value === 'object') {
    const nestedEntries = Object.entries(value)
    for (const [nestedField, nestedValue] of nestedEntries) {
      const nestedMessage = getMessageFromFieldValue(nestedField, nestedValue)
      if (nestedMessage) return nestedMessage
    }
  }

  return ''
}

function extractPayloadMessage(payload) {
  if (!payload) return ''

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }

  if (typeof payload !== 'object') return ''

  const priorityKeys = ['detail', 'error', 'message', 'non_field_errors']
  for (const key of priorityKeys) {
    const value = payload[key]
    if (Array.isArray(value) && value.length > 0) {
      const first = String(value[0] || '').trim()
      if (first) return first
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  for (const [field, value] of Object.entries(payload)) {
    if (priorityKeys.includes(field)) continue
    const message = getMessageFromFieldValue(field, value)
    if (message) return message
  }

  return ''
}

function isGenericMessage(message) {
  const normalizedMessage = normalizeText(message)
  if (!normalizedMessage) return true
  if (normalizedMessage.length < 9) return true

  return GENERIC_MESSAGE_PATTERNS.some((pattern) => pattern.test(normalizedMessage))
}

function buildStatusFallback(status, action) {
  if (status === 400) {
    return `No se pudo ${action}. Revisa los datos ingresados e intentalo nuevamente.`
  }

  if (status === 401) {
    return `No se pudo ${action} porque tu sesion ya no es valida. Inicia sesion nuevamente.`
  }

  if (status === 403) {
    return `No tienes permisos para ${action}.`
  }

  if (status === 404) {
    return `No se encontro la informacion necesaria para ${action}.`
  }

  if (status === 409) {
    return `No se pudo ${action} porque hay un conflicto con el estado actual de los datos.`
  }

  if (status === 429) {
    return `Superaste el limite de intentos para ${action}. Espera un momento e intentalo otra vez.`
  }

  if (status >= 500) {
    return `No se pudo ${action} por un problema interno del servidor. Intentalo nuevamente en unos minutos.`
  }

  return ''
}

export function getApiErrorMessage(error, options = {}) {
  const action = options.action || 'completar esta accion'
  const fallback = options.fallback || ''

  if (error?.code === 'ECONNABORTED') {
    return `No se pudo ${action} porque el servidor tardo demasiado en responder. Verifica tu conexion e intentalo de nuevo.`
  }

  if (error?.message === 'Network Error' || !error?.response) {
    return `No se pudo ${action} porque no hay conexion con el servidor. Revisa tu internet e intentalo de nuevo.`
  }

  const payloadMessage = extractPayloadMessage(error?.response?.data)
  if (payloadMessage) {
    if (isUnsafeTechnicalMessage(payloadMessage)) {
      const statusFallback = buildStatusFallback(error?.response?.status, action)
      if (statusFallback) return statusFallback
      if (fallback) return fallback
      return `No se pudo ${action}. Intentalo nuevamente.`
    }

    if (isGenericMessage(payloadMessage)) {
      return `No se pudo ${action}. ${toSentence(payloadMessage)}`
    }
    return payloadMessage
  }

  const statusFallback = buildStatusFallback(error?.response?.status, action)
  if (statusFallback) return statusFallback

  if (fallback) return fallback

  return `No se pudo ${action}. Intentalo nuevamente.`
}
