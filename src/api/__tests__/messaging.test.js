import { describe, it, expect, vi } from 'vitest';
import { 
    getConversations,
    getConversation,
    startConversation,
    markAsRead,
    getMessages,
    sendMessage,
    searchUsers
} from '../messaging';
import { api } from '../axios';

vi.mock('../axios', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

describe('messaging api', () => {
    it('getConversations calls correct endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
        const result = await getConversations();
        expect(api.get).toHaveBeenCalledWith('/api/v1/messaging/conversations/');
        expect(result).toEqual([{ id: 1 }]);
    });

    it('getConversation calls correct endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: { id: 2 } });
        const result = await getConversation(2);
        expect(api.get).toHaveBeenCalledWith('/api/v1/messaging/conversations/2/');
        expect(result).toEqual({ id: 2 });
    });

    it('startConversation sends correct id', async () => {
        api.post.mockResolvedValueOnce({ data: { id: 3 } });
        const result = await startConversation(10);
        expect(api.post).toHaveBeenCalledWith('/api/v1/messaging/conversations/start/', { recipient_id: 10 });
        expect(result).toEqual({ id: 3 });
    });

    it('markAsRead calls correct endpoint', async () => {
        api.post.mockResolvedValueOnce({ data: { success: true } });
        await markAsRead(5);
        expect(api.post).toHaveBeenCalledWith('/api/v1/messaging/conversations/5/read_all/');
    });

    it('getMessages calls correct endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: [{ text: 'hey' }] });
        await getMessages(5);
        expect(api.get).toHaveBeenCalledWith('/api/v1/messaging/messages/?conversation=5');
    });

    it('sendMessage calls correct endpoint', async () => {
        api.post.mockResolvedValueOnce({ data: { id: 99 } });
        await sendMessage(5, 'hello');
        expect(api.post).toHaveBeenCalledWith('/api/v1/messaging/messages/', { conversation_id: 5, content: 'hello' });
    });

    it('searchUsers calls correct endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: [{ username: 'john' }] });
        await searchUsers('jo');
        expect(api.get).toHaveBeenCalledWith('/api/v1/messaging/users/?search=jo');
    });
});
