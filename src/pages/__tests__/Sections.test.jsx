import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Sections from '../curriculums/Sections'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Sections page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            name: 'A',
            is_active: true,
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] })
    api.post.mockResolvedValue({ data: {} })
    api.patch.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the delete action and removes a section after confirmation', async () => {
    const user = userEvent.setup()

    render(<Sections />)

    expect(await screen.findByText('A')).toBeInTheDocument()

    const sectionRow = screen.getByText('A').closest('tr')
    expect(within(sectionRow).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()

    await user.click(within(sectionRow).getByRole('button', { name: 'Eliminar' }))

    const dialog = screen.getByRole('alertdialog', { name: /eliminar secci[oó]n/i })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/v1/courses/course-sections/1/')
    })

    expect(await screen.findByText('No hay secciones registradas.')).toBeInTheDocument()
  })
})
