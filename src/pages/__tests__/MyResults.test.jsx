import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyResults from '../MyResults';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  }
}));

describe('MyResults page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <MyResults />
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando resultados...')).toBeInTheDocument();
  });

  it('renders empty state when no enrollments', async () => {
    api.get.mockResolvedValueOnce({ data: { enrollments: [] } });

    render(
      <MemoryRouter>
        <MyResults />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No estás inscrito en ninguna materia')).toBeInTheDocument();
    });
  });

  it('renders statistics and subjects', async () => {
    const enrollments = [
      { 
        enrollment_id: 1, 
        subject_id: 101, 
        subject_name: 'Math', 
        stats: { grade: 4.5, average_score: 4.0, graded_count: 5, total_exercises: 5 } 
      }
    ];
    api.get.mockResolvedValueOnce({ data: { enrollments } });

    render(
      <MemoryRouter>
        <MyResults />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mis Resultados')).toBeInTheDocument();
      expect(screen.getByText('Math')).toBeInTheDocument();
      expect(screen.getByText('5/5 calificados')).toBeInTheDocument();
    });
  });

  it('calls exportToCSV when button is clicked', async () => {
    const enrollments = [
      { enrollment_id: 1, subject_name: 'Math', stats: { grade: 4.5 } }
    ];
    api.get.mockResolvedValueOnce({ data: { enrollments } });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyResults />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Exportar CSV'));

    // Test creates a blob and object URL. Just ensure no error is thrown by verifying mock was called.
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
