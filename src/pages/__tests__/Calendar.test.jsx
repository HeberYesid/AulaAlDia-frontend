import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarPage from '../Calendar';
import { api } from '../../api/axios';
import { useAuth } from '../../state/AuthContext';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
  },
  setApiActiveTenantId: vi.fn(),
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated'
}));

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('Calendar page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test', role: 'TEACHER' }
    });
  });

  it('fetches and renders subjects and events', async () => {
    const subjects = [{ id: 101, name: 'Math' }];
    const events = [
      { 
        id: 1, 
        title: 'Math Exam', 
        start: new Date(new Date().setHours(10,0,0,0)).toISOString(), 
        end: new Date(new Date().setHours(12,0,0,0)).toISOString(),
        description: 'Midterm exam'
      }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({ data: { results: subjects } });
      }
      if (url === '/api/v1/courses/calendar/all_events/') {
        return Promise.resolve({ data: events });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('Calendario Académico')).toBeInTheDocument();
      expect(screen.getByText('Math Exam')).toBeInTheDocument();
    });
  });

  it('filters events by subject', async () => {
    const subjects = [{ id: 101, name: 'Math' }];
    const eventsAll = [
        { title: 'Math Exam', start: new Date().toISOString(), end: new Date().toISOString() }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({ data: { results: subjects } });
      }
      if (url === '/api/v1/courses/calendar/all_events/') {
        return Promise.resolve({ data: eventsAll });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const user = userEvent.setup();
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Filtrar por materia/i })).toBeInTheDocument();
    });

    const filter = screen.getByRole('combobox', { name: /Filtrar por materia/i });
    await user.selectOptions(filter, '101');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/api/v1/courses/calendar/all_events/', 
        expect.objectContaining({ params: { subject: '101' } })
      );
    });
  });

  it('shows event details in modal when event is clicked', async () => {
    const subjects = [];
    const eventsAll = [
        { title: 'Math Exam', description: 'Exam details', start: new Date().toISOString(), end: new Date().toISOString() }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/courses/subjects/') {
        return Promise.resolve({ data: { results: subjects } });
      }
      if (url === '/api/v1/courses/calendar/all_events/') {
        return Promise.resolve({ data: eventsAll });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const user = userEvent.setup();
    render(<CalendarPage />);

    let eventEl;
    await waitFor(() => {
      eventEl = screen.getByText('Math Exam');
      expect(eventEl).toBeInTheDocument();
    });

    await user.click(eventEl);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Exam details')).toBeInTheDocument();
    });
    
    // Test closing modal via dialog's Cerrar button
    const dialog = screen.getByRole('dialog');
    const closeBtn = dialog.querySelector('button.btn.secondary');
    await user.click(closeBtn);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
