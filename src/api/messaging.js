import { api } from './axios';
import { API_ENDPOINTS } from './endpoints';
import { unwrapListData } from '../utils/pagination';

export const getConversations = async () => {
    const { data } = await api.get(API_ENDPOINTS.messaging.conversations);
    return unwrapListData(data);
};

export const getConversation = async (id) => {
    const { data } = await api.get(API_ENDPOINTS.messaging.conversationById(id));
    return data;
};

export const startConversation = async (recipientId) => {
    const { data } = await api.post(API_ENDPOINTS.messaging.startConversation, { recipient_id: recipientId });
    return data;
};

export const markAsRead = async (conversationId) => {
    const { data } = await api.post(API_ENDPOINTS.messaging.readAll(conversationId));
    return data;
};

export const getMessages = async (conversationId) => {
    const { data } = await api.get(API_ENDPOINTS.messaging.messagesByConversation(conversationId));
    return unwrapListData(data);
};

export const sendMessage = async (conversationId, content) => {
    const { data } = await api.post(API_ENDPOINTS.messaging.messages, { conversation_id: conversationId, content });
    return data;
};

export const searchUsers = async (query) => {
    const { data } = await api.get(API_ENDPOINTS.messaging.usersSearch(encodeURIComponent(query)));
    return unwrapListData(data);
};
