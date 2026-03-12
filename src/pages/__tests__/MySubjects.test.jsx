import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MySubjects from '../MySubjects';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  }
}));

describe('MySubjects page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state
    render(
      <MemoryRouter>
        <MySubjects />
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando materias...')).toBeInTheDocument();
  });

  it('renders empty state when no enrollments', async () => {
    api.get.mockResolvedValueOnce({ data: { enrollments: [] } });

    render(
      <MemoryRouter>
        <MySubjects />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No estás inscrito en ninguna materia')).toBeInTheDocument();
    });
  });

  it('renders list of enrollments and navigates on click', async () => {
    const enrollments = [
      { enrollment_id: 1, subject_id: 101, subject_name: 'Math', stats: { grade: 4.5, average_score: 4.0 } }
    ];
    api.get.mockResolvedValueOnce({ data: { enrollments } });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/mysubjects']}>
        <Routes>
          <Route path="/mysubjects" element={<MySubjects />} />
          <Route path="/subjects/:id" element={<div data-testid="subject-detail-page">Subject Detail</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mis Materias')).toBeInTheDocument();
    });

    expect(screen.getByText('Math')).toBeInTheDocument();
    
    // Click the "Ver" button
    await user.click(screen.getByRole('button', { name: /ver/i }));

    await waitFor(() => {
      expect(screen.getByTestId('subject-detail-page')).toBeInTheDocument();
    });
  });
});
