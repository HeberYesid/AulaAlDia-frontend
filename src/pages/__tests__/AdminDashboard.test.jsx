import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}));

const renderComponent = () => render(
  <MemoryRouter>
    <AdminDashboard />
  </MemoryRouter>
);

describe('AdminDashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getByText('Cargando panel de administrador...')).toBeInTheDocument();
  });

  it('renders admin dashboard data correctly when all requests succeed', async () => {
    api.get.mockImplementation((url) => {
      // Check dashboard URL before subjects (since it also contains /subjects/)
      if (url.includes('/dashboard/')) {
        return Promise.resolve({ data: { aggregates: { total_submitted_results: 5, total_graded_results: 5, avg_score: 4.5, avg_grade: 4.5 } } });
      }
      if (url.includes('/subjects/')) return Promise.resolve({ data: { results: [{ id: 1, name: 'Math', enrollments_count: 10 }] } });
      if (url.includes('/absences/')) return Promise.resolve({ data: [] });
      if (url.includes('/observations/')) return Promise.resolve({ data: [] });
      if (url.includes('/notifications/')) return Promise.resolve({ data: [] });
      if (url.includes('/calendar/all_events/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-periods/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-settings/')) return Promise.resolve({ data: { period_scheme: 'SEMESTER', min_grade: '1.0', max_grade: '5.0' } });
      return Promise.reject(new Error('not mocked: ' + url));
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Math')).toBeInTheDocument();
    });
  });

  it('renders blocks with partial errors gracefully', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/subjects/')) return Promise.reject(new Error('Failed subjects'));
      if (url.includes('/absences/')) return Promise.resolve({ data: [] });
      if (url.includes('/observations/')) return Promise.resolve({ data: [] });
      if (url.includes('/notifications/')) return Promise.resolve({ data: [] });
      if (url.includes('/calendar/all_events/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-periods/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-settings/')) return Promise.resolve({ data: null });
      return Promise.reject(new Error('not mocked'));
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
      expect(screen.getByText(/dashboard carg/i)).toBeInTheDocument();
    });
  });
});
