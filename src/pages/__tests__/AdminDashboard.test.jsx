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

const addDays = (baseDate, days) => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const asDateOnly = (value) => value.toISOString().split('T')[0];

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
      if (url.includes('/announcements/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-periods/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-settings/')) return Promise.resolve({ data: { period_scheme: 'SEMESTER', min_grade: '1.0', max_grade: '5.0' } });
      return Promise.reject(new Error('not mocked: ' + url));
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument();
    });
  });

  it('renders five stat cards in dashboard stats grid', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/dashboard/')) {
        return Promise.resolve({ data: { aggregates: { total_submitted_results: 5, total_graded_results: 5, avg_score: 4.5, avg_grade: 4.5 } } });
      }
      if (url.includes('/subjects/')) return Promise.resolve({ data: { results: [{ id: 1, name: 'Math', enrollments_count: 10 }] } });
      if (url.includes('/absences/')) return Promise.resolve({ data: [] });
      if (url.includes('/observations/')) return Promise.resolve({ data: [] });
      if (url.includes('/notifications/')) return Promise.resolve({ data: [] });
      if (url.includes('/calendar/all_events/')) return Promise.resolve({ data: [] });
      if (url.includes('/announcements/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-periods/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-settings/')) return Promise.resolve({ data: { period_scheme: 'SEMESTER', min_grade: '1.0', max_grade: '5.0' } });
      return Promise.reject(new Error('not mocked: ' + url));
    });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument();
    });

    const statCards = container.querySelectorAll('.stats-grid .stat-card');
    expect(statCards).toHaveLength(5);
  });

  it('renders blocks with partial errors gracefully', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/subjects/')) return Promise.reject(new Error('Failed subjects'));
      if (url.includes('/absences/')) return Promise.resolve({ data: [] });
      if (url.includes('/observations/')) return Promise.resolve({ data: [] });
      if (url.includes('/notifications/')) return Promise.resolve({ data: [] });
      if (url.includes('/calendar/all_events/')) return Promise.resolve({ data: [] });
      if (url.includes('/announcements/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-periods/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-settings/')) return Promise.resolve({ data: null });
      return Promise.reject(new Error('not mocked'));
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/algunas secciones no se pudieron actualizar/i);
    });
  });

  it('shows absences and observer totals for active period', async () => {
    const now = new Date();
    const activeStart = addDays(now, -2);
    const activeEnd = addDays(now, 10);
    const inactiveStart = addDays(now, -20);
    const inactiveEnd = addDays(now, -5);

    api.get.mockImplementation((url) => {
      if (url.includes('/subjects/')) return Promise.resolve({ data: [] });
      if (url.includes('/absences/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              date: asDateOnly(addDays(now, -1)),
              justified: false,
              student_name: 'Ana Activa',
              student_email_display: 'ana@example.com',
            },
            {
              id: 2,
              date: asDateOnly(addDays(now, -6)),
              justified: false,
              student_name: 'Luis Fuera',
              student_email_display: 'luis@example.com',
            },
          ],
        });
      }
      if (url.includes('/observations/')) {
        return Promise.resolve({
          data: [
            {
              id: 101,
              occurred_on: asDateOnly(addDays(now, -1)),
              created_at: addDays(now, -1).toISOString(),
              title: 'Observación vigente',
              category: 'OTHER',
              student_name: 'Ana Activa',
            },
            {
              id: 102,
              occurred_on: asDateOnly(addDays(now, -4)),
              created_at: addDays(now, -4).toISOString(),
              title: 'Observación fuera de periodo',
              category: 'OTHER',
              student_name: 'Luis Fuera',
            },
          ],
        });
      }
      if (url.includes('/notifications/')) return Promise.resolve({ data: [] });
      if (url.includes('/calendar/all_events/')) return Promise.resolve({ data: [] });
      if (url.includes('/announcements/')) return Promise.resolve({ data: [] });
      if (url.includes('/academic-periods/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              year: now.getFullYear(),
              sequence: 1,
              period_number: 1,
              start_date: asDateOnly(inactiveStart),
              end_date: asDateOnly(inactiveEnd),
              is_closed: false,
              label: 'Periodo anterior',
              is_grade_locked: false,
            },
            {
              id: 2,
              year: now.getFullYear(),
              sequence: 2,
              period_number: 2,
              start_date: asDateOnly(activeStart),
              end_date: asDateOnly(activeEnd),
              is_closed: false,
              label: 'Periodo activo',
              is_grade_locked: false,
            },
          ],
        });
      }
      if (url.includes('/academic-settings/')) {
        return Promise.resolve({
          data: {
            period_scheme: 'SEMESTER',
            min_grade: '1.0',
            max_grade: '5.0',
          },
        });
      }
      return Promise.reject(new Error('not mocked: ' + url));
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ausencias')).toBeInTheDocument();
      expect(screen.getByText('Observador')).toBeInTheDocument();
    });

    const absencesCard = screen.getByRole('link', { name: 'Ir al módulo de asistencia' });
    const observerCard = screen.getByRole('link', { name: 'Ir al observador' });

    const absencesText = (absencesCard.textContent || '').replace(/\s+/g, ' ');
    const observerText = (observerCard.textContent || '').replace(/\s+/g, ' ');

    expect(absencesText).toContain('Hay un total de 1 ausencias en este periodo.');
    expect(observerText).toContain('Hay un total de 1 observaciones en este periodo.');
  });
});
