import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyBulletins from '../MyBulletins';
import { api } from '../../api/axios';
import { AuthProvider } from '../../state/AuthContext';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}));

const renderWithAuth = (ui) => render(
  <MemoryRouter>
    <AuthProvider>{ui}</AuthProvider>
  </MemoryRouter>
);

describe('MyBulletins page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithAuth(<MyBulletins />);
    
    expect(screen.getByText('Cargando boletines...')).toBeInTheDocument();
  });

  it('renders empty scenario correctly', async () => {
    api.get.mockResolvedValueOnce({ data: { bulletins: [] } });

    renderWithAuth(<MyBulletins />);
    
    await waitFor(() => {
      expect(screen.getByText('No tienes boletines disponibles')).toBeInTheDocument();
    });
  });

  it('renders bulletins grouped by year', async () => {
    const bulletins = [
      { id: 1, year: 2023, period_number: 1, period_label: 'Per 1', average_grade: 4.0, total_subjects: 5 }
    ];
    api.get.mockResolvedValueOnce({ data: { bulletins } });

    renderWithAuth(<MyBulletins />);
    
    await waitFor(() => {
      expect(screen.getByText('📋 Mis Boletines')).toBeInTheDocument();
      expect(screen.getByText('📅 Año 2023')).toBeInTheDocument();
      expect(screen.getByText('Periodo 1')).toBeInTheDocument();
    });
  });

  it('expands bulletin detail on click', async () => {
    const bulletins = [
      { id: 1, year: 2023, period_number: 1, period_label: 'Per 1', average_grade: 4.0, total_subjects: 1 }
    ];
    // List
    api.get.mockResolvedValueOnce({ data: { bulletins } });
    
    // Detail
    api.get.mockResolvedValueOnce({
      data: {
        id: 1,
        period_label: 'Per 1',
        average_grade: 4.0,
        entries: [
          { id: 101, subject_name: 'Math', grade: 4.0, average_score: 4.0, graded_count: 5, submitted_count: 5 }
        ]
      }
    });

    const user = userEvent.setup();
    renderWithAuth(<MyBulletins />);
    
    await waitFor(() => {
      expect(screen.getByText('Periodo 1')).toBeInTheDocument();
    });

    // Expand
    const cardBtn = screen.getByRole('button', { name: /Ver boletín Per 1/i });
    await user.click(cardBtn);

    await waitFor(() => {
      expect(screen.getByText('Detalle — Per 1')).toBeInTheDocument();
      expect(screen.getByText('Math')).toBeInTheDocument();
    });
  });
});
