import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import GradeLevels from '../curriculums/GradeLevels'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('GradeLevels', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/grade-levels/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Grado Migrado',
              is_active: true,
            },
          ],
        })
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })

    api.post.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
  })

  it('opens the delete confirmation and removes a grade', async () => {
    const user = userEvent.setup()

    render(<GradeLevels />)

    expect(await screen.findByText('Grado Migrado')).toBeInTheDocument()

    const gradeRow = screen.getByText('Grado Migrado').closest('tr')
    await user.click(within(gradeRow).getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent('¿Eliminar grado?')

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/v1/courses/grade-levels/1/')
    })
  })
})