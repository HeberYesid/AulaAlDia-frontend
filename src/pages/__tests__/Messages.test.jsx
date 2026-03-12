import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Messages from '../messaging/Messages';
import { api } from '../../api/axios';
import { AuthProvider } from '../../state/AuthContext';
import * as messagingApi from '../../api/messaging';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}));

vi.mock('../../api/messaging', () => ({
  getConversations: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  startConversation: vi.fn(),
  searchUsers: vi.fn(),
  markAsRead: vi.fn()
}));

const mockUser = {
  id: 1,
  first_name: 'Test',
  last_name: 'User',
  role: 'STUDENT'
};

const renderWithAuth = (ui, initialEntries = ['/messages']) => {
  // Pre-fill localStorage to mock useAuth state
  localStorage.setItem('auth', JSON.stringify({ user: mockUser, access: 'mock-token' }));
  
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/messages" element={ui} />
          <Route path="/messages/:conversationId" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Messages page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    messagingApi.getConversations.mockResolvedValue([]);
    messagingApi.getMessages.mockResolvedValue([]);
    messagingApi.searchUsers.mockResolvedValue([]);
    
    // AuthProvider also hits /api/v1/auth/my-tenants/ so mock it broadly
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/my-tenants/') return Promise.resolve({ data: { tenants: [] } })
      return Promise.resolve({ data: {} })
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders correctly and fetches conversations', async () => {
    const mockConversations = [
      { id: 101, participants: [{ id: 1, first_name: 'Test' }, { id: 2, first_name: 'Other' }], unread_count: 0 }
    ];
    messagingApi.getConversations.mockResolvedValueOnce(mockConversations);

    renderWithAuth(<Messages />);

    await waitFor(() => {
      expect(messagingApi.getConversations).toHaveBeenCalled();
    });
  });

  it('loads a specific conversation if conversationId is in params', async () => {
    const mockConversations = [
      { 
        id: 101, 
        last_message: { content: 'Hello' },
        participants: [{ id: 1, first_name: 'Test' }, { id: 2, first_name: 'Other' }], 
        unread_count: 0 
      }
    ];
    const mockMessages = [
      { id: 1, content: 'Hello', sender: { id: 2 } }
    ];
    
    messagingApi.getConversations.mockResolvedValueOnce(mockConversations);
    messagingApi.getMessages.mockResolvedValueOnce(mockMessages);

    renderWithAuth(<Messages />, ['/messages/101']);

    await waitFor(() => {
      expect(messagingApi.getConversations).toHaveBeenCalled();
      expect(messagingApi.getMessages).toHaveBeenCalledWith(101);
      expect(messagingApi.markAsRead).toHaveBeenCalledWith(101);
    });
  });
});
