import { describe, it, expect } from 'vitest'
import { getApiErrorMessage } from '../apiErrorMessage'

describe('apiErrorMessage utility', () => {
  it('returns timeout-specific message for ECONNABORTED', () => {
    const message = getApiErrorMessage(
      { code: 'ECONNABORTED' },
      { action: 'guardar los cambios' }
    )

    expect(message).toContain('guardar los cambios')
    expect(message).toContain('tardo demasiado en responder')
  })

  it('returns network message when response is missing', () => {
    const message = getApiErrorMessage(
      { message: 'Network Error' },
      { action: 'cargar los datos' }
    )

    expect(message).toContain('cargar los datos')
    expect(message).toContain('no hay conexion con el servidor')
  })

  it('returns payload detail when it is specific', () => {
    const message = getApiErrorMessage({
      response: {
        data: { detail: 'Correo ya registrado' },
      },
    })

    expect(message).toBe('Correo ya registrado')
  })

  it('wraps generic payload messages with contextual action', () => {
    const message = getApiErrorMessage(
      {
        response: {
          data: { detail: 'Error' },
        },
      },
      { action: 'crear la cuenta' }
    )

    expect(message).toBe('No se pudo crear la cuenta. Error.')
  })

  it('extracts field-level array errors using humanized label', () => {
    const message = getApiErrorMessage({
      response: {
        data: { email: ['Este correo ya existe'] },
      },
    })

    expect(message).toBe('correo: Este correo ya existe')
  })

  it('extracts nested object field errors', () => {
    const message = getApiErrorMessage({
      response: {
        data: {
          profile: {
            student_email: ['Correo invalido'],
          },
        },
      },
    })

    expect(message).toBe('correo del estudiante: Correo invalido')
  })

  it('returns status-based fallback when payload has no usable message', () => {
    const message = getApiErrorMessage(
      {
        response: {
          status: 403,
          data: {},
        },
      },
      { action: 'editar esta materia' }
    )

    expect(message).toBe('No tienes permisos para editar esta materia.')
  })

  it('returns custom fallback when status has no predefined message', () => {
    const message = getApiErrorMessage(
      {
        response: {
          status: 418,
          data: {},
        },
      },
      { fallback: 'Ocurrio un problema personalizado.' }
    )

    expect(message).toBe('Ocurrio un problema personalizado.')
  })

  it('returns generic fallback when no other strategy resolves message', () => {
    const message = getApiErrorMessage({
      response: {
        status: 418,
        data: {},
      },
    })

    expect(message).toBe('No se pudo completar esta accion. Intentalo nuevamente.')
  })
})
