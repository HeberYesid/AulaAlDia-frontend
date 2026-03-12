import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPage from '../Notifications';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Notifications page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    
    render(<NotificationsPage />);
    
    expect(screen.getByText('Cargando notificaciones...')).toBeInTheDocument();
  });

  it('renders empty state correctly', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    
    render(<NotificationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No tienes notificaciones')).toBeInTheDocument();
    });
  });

  it('renders notifications accurately', async () => {
    const notifications = [
      {
        id: 1,
        title: 'New Grade',
        message: 'You got an A',
        is_read: false,
        notification_type: 'RESULT_CREATED',
        created_at: '2023-10-01T12:00:00Z'
      },
      {
        id: 2,
        title: 'New Event',
        message: 'Meeting tomorrow',
        is_read: true,
        notification_type: 'GENERAL',
        created_at: '2023-10-02T12:00:00Z'
      }
    ];
    
    api.get.mockResolvedValueOnce({ data: notifications });
    
    render(<NotificationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Tienes 1 notificación sin leer')).toBeInTheDocument();
      expect(screen.getByText('New Grade')).toBeInTheDocument();
      expect(screen.getByText('Meeting tomorrow')).toBeInTheDocument();
    });
  });

  it('allows marking a notification as read/unread', async () => {
    const notifications = [
      {
        id: 1,
        title: 'New Grade',
        message: 'You got an A',
        is_read: false,
        notification_type: 'RESULT_CREATED',
        created_at: '2023-10-01T12:00:00Z'
      }
    ];
    
    api.get.mockResolvedValueOnce({ data: notifications });
    api.patch.mockResolvedValueOnce({ data: {} });
    api.get.mockResolvedValueOnce({ data: [{ ...notifications[0], is_read: true }] }); // simulate reload
    
    const user = userEvent.setup();
    render(<NotificationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('New Grade')).toBeInTheDocument();
    });
    
    const markBtn = screen.getByRole('button', { name: /Marcar como leída/i });
    await user.click(markBtn);
    
    expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/notifications/1/', { is_read: true });
  });

  it('allows marking all notifications as read', async () => {
    const notifications = [
      { id: 1, title: 'Note 1', is_read: false },
      { id: 2, title: 'Note 2', is_read: false }
    ];
    
    api.get.mockResolvedValueOnce({ data: notifications });
    api.post.mockResolvedValueOnce({ data: {} });
    api.get.mockResolvedValueOnce({ data: notifications.map(n => ({...n, is_read: true})) });
    
    const user = userEvent.setup();
    render(<NotificationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Marcar todas como leídas')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Marcar todas como leídas'));
    
    expect(api.post).toHaveBeenCalledWith('/api/v1/courses/notifications/mark-all-read/');
  });

  it('allows deleting a notification', async () => {
    const notifications = [
      { id: 1, title: 'Note 1', is_read: true },
    ];
    
    api.get.mockResolvedValueOnce({ data: notifications });
    api.delete.mockResolvedValueOnce({ data: {} });
    api.get.mockResolvedValueOnce({ data: [] });
    
    const user = userEvent.setup();
    render(<NotificationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });
    
    const deleteBtn = screen.getByRole('button', { name: /Eliminar notificación/i });
    await user.click(deleteBtn);
    
    // confirm dialog
    await waitFor(() => {
      expect(screen.getByText('¿Estás seguro de que quieres eliminar esta notificación?')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /Confirmar/i }));
    
    expect(api.delete).toHaveBeenCalledWith('/api/v1/courses/notifications/1/');
  });
});
