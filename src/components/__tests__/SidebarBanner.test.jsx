import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SidebarBanner from '../SidebarBanner'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('SidebarBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refreshes the news panel when it is opened again', async () => {
    let allEventsRequestCount = 0

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/calendar/all_events/') {
        allEventsRequestCount += 1

        if (allEventsRequestCount === 1) {
          return Promise.resolve({ data: [] })
        }

        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Evento recién creado',
              start_time: '2030-05-10T10:00:00.000Z',
              end_time: '2030-05-10T11:00:00.000Z',
              description: 'Evento visible al reabrir el panel',
            },
          ],
        })
      }

      if (url === '/api/v1/courses/announcements/') {
        return Promise.resolve({ data: [] })
      }

      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    const user = userEvent.setup()
    render(<SidebarBanner />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2)
    })

    expect(screen.queryByText('Evento recién creado')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /abrir novedades/i }))

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(4)
    })

    expect(screen.getByText('Evento recién creado')).toBeInTheDocument()
    expect(allEventsRequestCount).toBe(2)
  })
})
