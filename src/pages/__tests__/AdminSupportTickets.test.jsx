import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminSupportTickets from '../AdminSupportTickets'
import { listSupportTickets, createSupportTicket } from '../../api/supportTickets'

vi.mock('../../api/supportTickets', () => ({
  listSupportTickets: vi.fn(),
  createSupportTicket: vi.fn(),
}))

describe('AdminSupportTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSupportTickets.mockResolvedValue([
      {
        id: 34,
        subject: 'Error en boletines',
        message: 'No permite generar boletines para el periodo actual.',
        created_by_name: 'Admin Colegio',
        created_by_email: 'admin@colegio.edu',
        status: 'OPEN',
        status_label: 'Abierto',
        created_at: '2026-03-30T09:00:00Z',
        resolved_at: null,
      },
    ])
  })

  it('loads support tickets on mount', async () => {
    render(<AdminSupportTickets />)

    expect(await screen.findByText('Error en boletines')).toBeInTheDocument()
    expect(listSupportTickets).toHaveBeenCalledTimes(1)
    expect(listSupportTickets).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ALL',
        search: '',
      })
    )
  })

  it('creates a new support ticket from form', async () => {
    const user = userEvent.setup()
    createSupportTicket.mockResolvedValue({
      id: 99,
      subject: 'Sincronizacion de notas',
      message: 'Las notas no se reflejan en el boletin final del curso.',
      created_by_name: 'Admin Colegio',
      created_by_email: 'admin@colegio.edu',
      status: 'OPEN',
      status_label: 'Abierto',
      created_at: '2026-03-30T10:30:00Z',
      resolved_at: null,
    })

    render(<AdminSupportTickets />)
    await screen.findByText('Error en boletines')

    await user.type(screen.getByLabelText(/Asunto/i), 'Sincronizacion de notas')
    await user.type(
      screen.getByLabelText(/Detalle del requerimiento/i),
      'Las notas no se reflejan en el boletin final del curso.'
    )

    await user.click(screen.getByRole('button', { name: /Crear ticket/i }))

    await waitFor(() => {
      expect(createSupportTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Sincronizacion de notas',
        })
      )
    })

    expect(await screen.findByText('Sincronizacion de notas')).toBeInTheDocument()
  })

  it('applies filters and allows reset', async () => {
    const user = userEvent.setup()

    render(<AdminSupportTickets />)
    await screen.findByText('Error en boletines')

    await user.selectOptions(screen.getByLabelText(/Filtrar por estado/i), 'RESOLVED')
    await waitFor(() => {
      expect(listSupportTickets).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'RESOLVED',
          search: '',
        })
      )
    })

    await user.type(screen.getByLabelText(/Buscar ticket/i), 'boletines')
    await waitFor(() => {
      expect(listSupportTickets).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'RESOLVED',
          search: 'boletines',
        })
      )
    })

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }))
    await waitFor(() => {
      expect(listSupportTickets).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'ALL',
          search: '',
        })
      )
    })
  })
})
