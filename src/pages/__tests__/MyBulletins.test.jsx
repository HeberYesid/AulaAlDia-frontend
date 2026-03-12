import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyBulletins from '../MyBulletins';
import { api } from '../../api/axios';
import { useAuth } from '../../state/AuthContext';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}));

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => render(
  <MemoryRouter>
    <MyBulletins />
  </MemoryRouter>
);

describe('MyBulletins page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1 },
      logout: vi.fn()
    });
  });

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getByText('Cargando boletines...')).toBeInTheDocument();
  });

  it('renders empty scenario correctly', async () => {
    api.get.mockResolvedValueOnce({ data: { bulletins: [] } });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No tienes boletines disponibles')).toBeInTheDocument();
    });
  });

  it('renders bulletins grouped by year', async () => {
    const bulletins = [
      { id: 1, year: 2023, period_number: 1, period_label: 'Per 1', average_grade: 4.0, total_subjects: 5, created_at: '2023-03-01T00:00:00Z' }
    ];
    api.get.mockResolvedValueOnce({ data: { bulletins } });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Mis Boletines/)).toBeInTheDocument();
      expect(screen.getByText(/Año 2023/)).toBeInTheDocument();
      expect(screen.getByText('Periodo 1')).toBeInTheDocument();
    });
  });

  it('expands bulletin detail on click', async () => {
    const bulletins = [
      { id: 1, year: 2023, period_number: 1, period_label: 'Per 1', average_grade: 4.0, total_subjects: 1, created_at: '2023-03-01T00:00:00Z' }
    ];
    api.get.mockResolvedValueOnce({ data: { bulletins } });
    
    api.get.mockResolvedValueOnce({
      data: {
        id: 1,
        period_label: 'Per 1',
        average_grade: 4.0,
        entries: [
          { id: 101, subject_name: 'Math', grade: 4.0, average_score: 4.0, graded_count: 5, submitted_count: 5, absence_count: 0 }
        ]
      }
    });

    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Periodo 1')).toBeInTheDocument();
    });

    const cardBtn = screen.getByRole('button', { name: /Ver boletín Per 1/i });
    await user.click(cardBtn);

    await waitFor(() => {
      expect(screen.getByText(/Detalle — Per 1/)).toBeInTheDocument();
      expect(screen.getByText('Math')).toBeInTheDocument();
    });
  });
});
