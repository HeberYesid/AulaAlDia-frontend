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

  it('extracts field-level string errors using generic field humanization', () => {
    const message = getApiErrorMessage({
      response: {
        data: { user_name: 'Formato invalido' },
      },
    })

    expect(message).toBe('user name: Formato invalido')
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

  it('uses first element from non_field_errors array', () => {
    const message = getApiErrorMessage({
      response: {
        data: { non_field_errors: ['No puedes realizar esta accion'] },
      },
    })

    expect(message).toBe('No puedes realizar esta accion')
  })

  it('uses payload string response when provided', () => {
    const message = getApiErrorMessage({
      response: {
        data: 'Error de validacion externo',
      },
    })

    expect(message).toBe('No se pudo completar esta accion. Error de validacion externo.')
  })

  it('hides raw html payload and returns status-based fallback', () => {
    const message = getApiErrorMessage(
      {
        response: {
          status: 404,
          data: '<!DOCTYPE html><html><head><title>Page not found</title></head><body>debug</body></html>',
        },
      },
      { action: 'activar el periodo academico' }
    )

    expect(message).toBe('No se encontro la informacion necesaria para activar el periodo academico.')
  })

  it('hides technical traceback strings from payload detail', () => {
    const message = getApiErrorMessage(
      {
        response: {
          status: 500,
          data: {
            detail: 'Traceback (most recent call last): ValueError at /api/v1/example',
          },
        },
      },
      {
        action: 'procesar',
        fallback: 'No se pudo procesar la solicitud. Intentalo nuevamente.',
      }
    )

    expect(message).toBe('No se pudo procesar por un problema interno del servidor. Intentalo nuevamente en unos minutos.')
  })

  it('treats unknown object payload as generic and appends payload text', () => {
    const message = getApiErrorMessage(
      {
        response: {
          data: { meta: {} },
        },
      },
      { action: 'actualizar el registro' }
    )

    expect(message).toBe('No se pudo actualizar el registro. Intentalo nuevamente.')
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

  it.each([
    [400, 'guardar', 'No se pudo guardar. Revisa los datos ingresados e intentalo nuevamente.'],
    [401, 'continuar', 'No se pudo continuar porque tu sesion ya no es valida. Inicia sesion nuevamente.'],
    [404, 'consultar', 'No se encontro la informacion necesaria para consultar.'],
    [409, 'actualizar', 'No se pudo actualizar porque hay un conflicto con el estado actual de los datos.'],
    [429, 'enviar', 'Superaste el limite de intentos para enviar. Espera un momento e intentalo otra vez.'],
    [500, 'procesar', 'No se pudo procesar por un problema interno del servidor. Intentalo nuevamente en unos minutos.'],
  ])('maps status %s to its semantic fallback', (status, action, expected) => {
    const message = getApiErrorMessage(
      {
        response: {
          status,
          data: {},
        },
      },
      { action }
    )

    expect(message).toBe(expected)
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
