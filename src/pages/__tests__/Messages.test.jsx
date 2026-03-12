import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Messages from '../messaging/Messages';
import { useAuth } from '../../state/AuthContext';
import * as messagingApi from '../../api/messaging';

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn()
}));

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn()
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

const renderMessages = (initialEntries = ['/messages']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<Messages />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Messages page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.mockReturnValue({ user: mockUser });
    messagingApi.getConversations.mockResolvedValue([]);
    messagingApi.getMessages.mockResolvedValue([]);
    messagingApi.searchUsers.mockResolvedValue([]);
    messagingApi.markAsRead.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly and fetches conversations', async () => {
    const mockConversations = [
      { id: 101, participants: [{ id: 1, first_name: 'Test' }, { id: 2, first_name: 'Other' }], unread_count: 0 }
    ];
    messagingApi.getConversations.mockResolvedValue(mockConversations);

    renderMessages();

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

    messagingApi.getConversations.mockResolvedValue(mockConversations);
    messagingApi.getMessages.mockResolvedValue(mockMessages);

    renderMessages(['/messages/101']);

    await waitFor(() => {
      expect(messagingApi.getConversations).toHaveBeenCalled();
      expect(messagingApi.getMessages).toHaveBeenCalledWith(101);
      expect(messagingApi.markAsRead).toHaveBeenCalledWith(101);
    });
  });
});
