import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentDashboard from '../StudentDashboard';
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

describe('StudentDashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithAuth(<StudentDashboard />);
    
    expect(screen.getByText('Cargando dashboard…')).toBeInTheDocument();
  });

  it('renders empty data states correctly', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        summary: {},
        subjects_progress: [],
        pending_exercises: [],
        recent_results: []
      }
    });

    renderWithAuth(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Mis Materias')).toBeInTheDocument();
      expect(screen.getByText('No estás inscrito en ninguna materia')).toBeInTheDocument();
      expect(screen.getByText('¡No tienes ejercicios pendientes!')).toBeInTheDocument();
      expect(screen.getByText('No tienes resultados aún')).toBeInTheDocument();
    });
  });

  it('renders dashboard data correctly', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        summary: {},
        subjects_progress: [
          { subject_id: 1, subject_name: 'Math', total_absences: 2, unjustified_absences: 1 }
        ],
        pending_exercises: [
          { id: 1, name: 'Homework 1', subject_id: 1, subject_name: 'Math', subject_code: 'M1', deadline: '2023-11-01' }
        ],
        recent_results: [
          { id: 1, exercise_name: 'Quiz 1', status: 'SCORE', score: 4.5, subject_name: 'Math', created_at: '2023-10-15' }
        ]
      }
    });

    renderWithAuth(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument();
      expect(screen.getByText(/2 faltas/i)).toBeInTheDocument();
      expect(screen.getByText('Homework 1')).toBeInTheDocument();
      expect(screen.getByText('Quiz 1')).toBeInTheDocument();
      expect(screen.getByText('Nota 4.50')).toBeInTheDocument();
    });
  });
});
