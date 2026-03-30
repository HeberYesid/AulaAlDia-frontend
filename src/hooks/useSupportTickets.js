import { useCallback, useMemo, useState } from 'react'
import { createSupportTicket, listSupportTickets } from '../api/supportTickets'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const DEFAULT_FORM = {
  subject: '',
  message: '',
}

function normalizeApiError(error, fallbackMessage, action = 'completar esta accion') {
  return getApiErrorMessage(error, {
    action,
    fallback: fallbackMessage,
  })
}

export function useSupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(DEFAULT_FORM)

  const openTicketsCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'OPEN').length,
    [tickets]
  )

  const loadTickets = useCallback(async (filters = {}) => {
    setLoading(true)
    setError('')
    try {
      const nextTickets = await listSupportTickets(filters)
      setTickets(nextTickets)
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo cargar el historial de tickets de soporte.',
        'cargar el historial de tickets'
      ))
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createTicket = useCallback(async () => {
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        subject: form.subject.trim(),
        message: form.message.trim(),
      }
      const createdTicket = await createSupportTicket(payload)
      setTickets((current) => [createdTicket, ...current])
      setForm(DEFAULT_FORM)
      setSuccess('Ticket creado correctamente. Te contactaremos por este canal en cuanto sea revisado.')
      return true
    } catch (err) {
      setError(normalizeApiError(
        err,
        'No se pudo crear el ticket. Revisa el asunto y el detalle del mensaje.',
        'crear el ticket de soporte'
      ))
      return false
    } finally {
      setCreating(false)
    }
  }, [form])

  return {
    tickets,
    loading,
    creating,
    error,
    success,
    form,
    openTicketsCount,
    setForm,
    loadTickets,
    createTicket,
  }
}
