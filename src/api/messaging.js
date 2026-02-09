import { api } from './axios';

export const getConversations = async () => {
    const { data } = await api.get('/api/v1/messaging/conversations/');
    return data;
};

export const getConversation = async (id) => {
    const { data } = await api.get(`/api/v1/messaging/conversations/${id}/`);
    return data;
};

export const startConversation = async (recipientId) => {
    const { data } = await api.post('/api/v1/messaging/conversations/start/', { recipient_id: recipientId });
    return data;
};

export const markAsRead = async (conversationId) => {
    const { data } = await api.post(`/api/v1/messaging/conversations/${conversationId}/read_all/`);
    return data;
};

export const getMessages = async (conversationId) => {
    // Note: The backend MessageViewSet filters by conversation__participants=user, 
    // but we usually want messages for a specific conversation.
    // We might need to filter by conversation ID in the query params if the viewset supports it,
    // or just rely on the conversation detail view which includes messages if we updated the serializer.
    // However, the current MessageViewSet returns all messages for the user.
    // Let's update the backend to allow filtering by conversation.
    
    // Wait, I implemented MessageViewSet.get_queryset to return all messages for conversations the user is in.
    // I should probably add a filter backend or just filter in the frontend (inefficient).
    // Better: The ConversationSerializer already includes `last_message`.
    // But for the chat window, we need ALL messages.
    // Let's assume we can filter by conversation in the MessageViewSet.
    // I'll update the backend view to support filtering.
    const { data } = await api.get(`/api/v1/messaging/messages/?conversation=${conversationId}`);
    return data;
};

export const sendMessage = async (conversationId, content) => {
    const { data } = await api.post('/api/v1/messaging/messages/', { conversation_id: conversationId, content });
    return data;
};

export const searchUsers = async (query) => {
    const { data } = await api.get(`/api/v1/messaging/users/?search=${query}`);
    return data;
};
