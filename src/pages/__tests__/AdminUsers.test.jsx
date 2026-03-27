import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminUsers from '../AdminUsers'
import {
  listTenantUsers,
  createTenantUser,
  updateTenantUserStatus,
  deleteTenantUser,
} from '../../api/users'

vi.mock('../../api/users', () => ({
  listTenantUsers: vi.fn(),
  createTenantUser: vi.fn(),
  updateTenantUserStatus: vi.fn(),
  deleteTenantUser: vi.fn(),
}))

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)

    listTenantUsers.mockResolvedValue([
      {
        id: 10,
        email: 'teacher@example.com',
        full_name: 'Teacher Demo',
        first_name: 'Teacher',
        last_name: 'Demo',
        role: 'TEACHER',
        is_active: true,
      },
    ])
  })

  it('loads tenant users list on mount', async () => {
    render(<AdminUsers />)

    expect(await screen.findByText('Teacher Demo')).toBeInTheDocument()
    expect(listTenantUsers).toHaveBeenCalledTimes(1)
    expect(listTenantUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        search: '',
        role: 'ALL',
        status: 'all',
      })
    )
  })

  it('applies role, status and search filters when listing users', async () => {
    const user = userEvent.setup()

    render(<AdminUsers />)
    await screen.findByText('Teacher Demo')

    await user.selectOptions(screen.getByLabelText(/Filtrar por rol/i), 'STUDENT')
    await waitFor(() => {
      expect(listTenantUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: 'STUDENT',
          status: 'all',
          search: '',
        })
      )
    })

    await user.selectOptions(screen.getByLabelText(/Filtrar por estado/i), 'inactive')
    await waitFor(() => {
      expect(listTenantUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: 'STUDENT',
          status: 'inactive',
          search: '',
        })
      )
    })

    await user.type(screen.getByLabelText(/Buscar usuario/i), 'ana')
    await waitFor(() => {
      expect(listTenantUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: 'STUDENT',
          status: 'inactive',
          search: 'ana',
        })
      )
    })

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }))
    await waitFor(() => {
      expect(listTenantUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: 'ALL',
          status: 'all',
          search: '',
        })
      )
    })
  })

  it('creates a new tenant user from the form', async () => {
    const user = userEvent.setup()
    createTenantUser.mockResolvedValue({
      id: 12,
      email: 'new-user@example.com',
      full_name: 'New User',
      first_name: 'New',
      last_name: 'User',
      role: 'STUDENT',
      is_active: true,
    })

    render(<AdminUsers />)
    await screen.findByText('Teacher Demo')

    await user.selectOptions(screen.getByLabelText(/^Rol$/i), 'STUDENT')
    await user.type(screen.getByLabelText(/Correo/i), 'new-user@example.com')
    await user.type(screen.getByLabelText(/^Nombre$/i), 'New')
    await user.type(screen.getByLabelText(/Apellido/i), 'User')
    await user.type(screen.getByLabelText(/Contraseña temporal/i), 'SecurePass123!')

    await user.click(screen.getByRole('button', { name: /Crear usuario/i }))

    await waitFor(() => {
      expect(createTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new-user@example.com',
          role: 'STUDENT',
        })
      )
    })

    expect(await screen.findByText('new-user@example.com')).toBeInTheDocument()
  })

  it('toggles user status and deletes user', async () => {
    const user = userEvent.setup()
    updateTenantUserStatus.mockResolvedValue({
      id: 10,
      email: 'teacher@example.com',
      full_name: 'Teacher Demo',
      first_name: 'Teacher',
      last_name: 'Demo',
      role: 'TEACHER',
      is_active: false,
    })

    render(<AdminUsers />)
    await screen.findByText('Teacher Demo')

    await user.click(screen.getByRole('button', { name: /Inhabilitar/i }))
    await waitFor(() => {
      expect(updateTenantUserStatus).toHaveBeenCalledWith(10, false)
    })

    deleteTenantUser.mockResolvedValue(undefined)
    await user.click(screen.getByRole('button', { name: /Eliminar/i }))

    await waitFor(() => {
      expect(deleteTenantUser).toHaveBeenCalledWith(10)
    })
  })
})
