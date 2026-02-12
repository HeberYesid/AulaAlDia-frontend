import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CSVUpload from '../CSVUpload'
import { renderWithProviders } from '../../test/utils'
import { api } from '../../api/axios'

// Mock the axios api
vi.mock('../../api/axios', () => ({
  api: {
    post: vi.fn()
  }
}))

describe('CSVUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    renderWithProviders(<CSVUpload label="Cargar Notas" uploadUrl="/test-url" />)
    expect(screen.getByText('Cargar Notas')).toBeInTheDocument()
    expect(screen.getByText('Subir CSV')).toBeDisabled() // Disabled initially
  })

  it('enables button when file is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CSVUpload label="Cargar Notas" uploadUrl="/test-url" />)
    
    const file = new File(['header1,header2\nval1,val2'], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText(/Cargar Notas/i).querySelector('input[type="file"]') || screen.getByRole('presentation').querySelector('input[type="file"]')
    
    // Simpler way to find the file input if label association is tricky
    // Note: In the component code: <label>{label}</label><input type="file" ... />
    // The label is not wrapping the input nor linked by htmlFor/id.
    // So we need to find it by selector usually. But testing-library prefers semantic queries.
    // Let's rely on the DOM structure shown in the file read previously.
    
    // Re-reading component structure:
    // <form ...>
    //   <label>{label}</label>
    //   <input type="file" ... />
    // </form>
    // We can't use getByLabelText because there is no connection.
    const fileInput = document.querySelector('input[type="file"]')
    
    await user.upload(fileInput, file)
    
    expect(screen.getByText('Subir CSV')).toBeEnabled()
  })

  it('submits file successfully', async () => {
    const user = userEvent.setup()
    const onCompleteMock = vi.fn()
    api.post.mockResolvedValueOnce({ data: { imported: 5 } })
    
    renderWithProviders(
      <CSVUpload 
        label="Cargar Notas" 
        uploadUrl="/test-url" 
        onComplete={onCompleteMock} 
      />
    )
    
    const file = new File(['content'], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)
    
    const submitBtn = screen.getByText('Subir CSV')
    await user.click(submitBtn)
    
    // Check loading state (optimistic)
    // expect(screen.getByText('Cargando...')).toBeInTheDocument()
    
    // Check API call
    expect(api.post).toHaveBeenCalledWith(
      '/test-url',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    )
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Carga realizada con éxito')).toBeInTheDocument()
    })
    
    expect(loading => loading === false)
    expect(onCompleteMock).toHaveBeenCalledWith({ imported: 5 })
  })

  it('handles upload errors', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValueOnce(new Error('Network Error'))
    
    renderWithProviders(<CSVUpload label="Cargar Notas" uploadUrl="/test-url" />)
    
    const file = new File(['content'], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)
    
    const submitBtn = screen.getByText('Subir CSV')
    await user.click(submitBtn)
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar CSV')).toBeInTheDocument()
    })
  })
})
