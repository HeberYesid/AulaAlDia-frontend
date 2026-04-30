import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Curriculums from '../curriculums/Curriculums'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const curriculumRows = [
  {
    id: 11,
    name: 'Malla Institucional',
    scope_type: 'TENANT_DEFAULT',
    is_default: true,
    is_active: true,
  },
  {
    id: 22,
    name: 'Malla 6A',
    scope_type: 'GRADE',
    is_default: false,
    is_active: false,
  },
]

function mockListResponse(url) {
  if (url === '/api/v1/courses/curriculums/') {
    return Promise.resolve({ data: curriculumRows })
  }

  if (url === '/api/v1/courses/grade-levels/') {
    return Promise.resolve({
      data: [
        {
          id: 1,
          name: '6to',
        },
      ],
    })
  }

  return Promise.reject(new Error(`Unexpected GET ${url}`))
}

describe('Curriculums page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation(mockListResponse)
    api.post.mockResolvedValue({ data: {} })
    api.patch.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the expected row actions and opens the edit modal', async () => {
    const user = userEvent.setup()

    render(<Curriculums />)

    expect(await screen.findByText('Malla Institucional')).toBeInTheDocument()

    const defaultRow = screen.getByText('Malla Institucional').closest('tr')
    const gradeRow = screen.getByText('Malla 6A').closest('tr')

    expect(within(defaultRow).getByRole('button', { name: 'Clonar para Grado' })).toBeInTheDocument()
    expect(within(defaultRow).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(within(defaultRow).getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()
    expect(within(defaultRow).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()

    expect(within(gradeRow).queryByRole('button', { name: 'Clonar para Grado' })).not.toBeInTheDocument()
    expect(within(gradeRow).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(within(gradeRow).getByRole('button', { name: 'Activar' })).toBeInTheDocument()
    expect(within(gradeRow).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()

    await user.click(within(defaultRow).getByRole('button', { name: 'Editar' }))

    const dialog = screen.getByRole('dialog', { name: /editar malla/i })
    const nameInput = within(dialog).getByLabelText('Nombre de la Malla')

    await user.clear(nameInput)
    await user.type(nameInput, 'Malla Institucional Actualizada')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/curriculums/11/', {
        name: 'Malla Institucional Actualizada',
      })
    })
  })

  it('toggles state and deletes grade curriculums from the table actions', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Curriculums />)

    expect(await screen.findByText('Malla 6A')).toBeInTheDocument()

    const gradeRow = screen.getByText('Malla 6A').closest('tr')

    await user.click(within(gradeRow).getByRole('button', { name: 'Activar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/curriculums/22/', {
        is_active: true,
      })
    })

    const refreshedGradeRow = screen.getByText('Malla 6A').closest('tr')
    await user.click(within(refreshedGradeRow).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled()
      expect(api.delete).toHaveBeenCalledWith('/api/v1/courses/curriculums/22/')
    })
  })
})