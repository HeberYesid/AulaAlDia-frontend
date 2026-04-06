import { getApiErrorMessage } from '../utils/apiErrorMessage'

function getErrorPayload(error) {
  const payload = error?.response?.data
  if (!payload || typeof payload !== 'object') {
    return null
  }
  return payload
}

export function normalizeApiError(error, { action = 'completar esta accion', fallback = '' } = {}) {
  if (action === 'completar esta accion' && !fallback && error?.userMessage) {
    return error.userMessage
  }

  return getApiErrorMessage(error, {
    action,
    fallback,
  })
}

export function normalizeApiErrorWithDetails(
  error,
  { action = 'completar esta accion', fallback = '' } = {}
) {
  const payload = getErrorPayload(error)

  if (!payload) {
    return normalizeApiError(error, { action, fallback })
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail.trim()
  }

  const lines = []
  Object.entries(payload).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      lines.push(`${field}: ${value.join(' ')}`)
      return
    }

    if (value && typeof value === 'object') {
      lines.push(`${field}: ${JSON.stringify(value)}`)
      return
    }

    lines.push(`${field}: ${String(value)}`)
  })

  if (lines.length > 0) {
    return lines.join(' | ')
  }

  return normalizeApiError(error, { action, fallback })
}

export function getApiFieldError(
  error,
  fieldName,
  { action = 'completar esta accion', fallback = '' } = {}
) {
  const payload = getErrorPayload(error)
  const fieldValue = payload?.[fieldName]

  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    const firstValue = String(fieldValue[0] || '').trim()
    if (firstValue) {
      return firstValue
    }
  }

  if (typeof fieldValue === 'string' && fieldValue.trim()) {
    return fieldValue.trim()
  }

  return normalizeApiError(error, { action, fallback })
}