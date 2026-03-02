import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import {
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    searchUsers,
    markAsRead,
} from '../../api/messaging';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import EmptyState from './EmptyState';
import NewChatModal from './NewChatModal';
import './Messages.css';

const Messages = () => {
    const { user } = useAuth();
    const { conversationId } = useParams();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    /* ── Fetch helpers ─────────────────────────────────── */
    const fetchConversations = useCallback(async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId) => {
        try {
            const data = await getMessages(conversationId);
            setMessages(data);
            await markAsRead(conversationId);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, []);

    /* ── Polling ───────────────────────────────────────── */
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (!selectedConversation) return;
        fetchMessages(selectedConversation.id);
        const interval = setInterval(() => fetchMessages(selectedConversation.id), 5000);
        return () => clearInterval(interval);
    }, [selectedConversation, fetchMessages]);

    useEffect(() => {
        if (!conversationId || conversations.length === 0) return;

        const targetConversation = conversations.find(
            (conversation) => String(conversation.id) === String(conversationId)
        );

        if (!targetConversation) return;

        setSelectedConversation((current) => {
            if (current?.id === targetConversation.id) return current;
            return targetConversation;
        });
        setMobileShowChat(true);
    }, [conversationId, conversations]);

    /* ── Handlers ──────────────────────────────────────── */
    const handleSendMessage = async (e) => {
        e?.preventDefault?.();
        if (!newMessage.trim() || !selectedConversation) return;
        try {
            await sendMessage(selectedConversation.id, newMessage);
            setNewMessage('');
            fetchMessages(selectedConversation.id);
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSearchUsers = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const results = await searchUsers(query);
                setSearchResults(results);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleStartConversation = async (recipientId) => {
        try {
            const conversation = await startConversation(recipientId);
            setSelectedConversation(conversation);
            setShowNewChatModal(false);
            setSearchQuery('');
            setSearchResults([]);
            setMobileShowChat(true);
            fetchConversations();
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const handleSelectConversation = (conv) => {
        setSelectedConversation(conv);
        setMobileShowChat(true);
    };

    const handleBack = () => {
        setMobileShowChat(false);
    };

    const handleCloseModal = useCallback(() => {
        setShowNewChatModal(false);
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    const getOtherParticipant = (conversation) => {
        return conversation.participants.find((p) => p.id !== user.id) || {};
    };

    /* ── Render ─────────────────────────────────────────── */
    return (
        <div className={`msg-container ${mobileShowChat ? 'msg-mobile-chat-open' : ''}`}>
            <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                currentUserId={user.id}
                onSelectConversation={handleSelectConversation}
                onNewChat={() => setShowNewChatModal(true)}
            />

            <div className="msg-main">
                {selectedConversation ? (
                    <ChatWindow
                        messages={messages}
                        currentUserId={user.id}
                        otherParticipant={getOtherParticipant(selectedConversation)}
                        newMessage={newMessage}
                        onNewMessageChange={setNewMessage}
                        onSendMessage={handleSendMessage}
                        onBack={handleBack}
                    />
                ) : (
                    <EmptyState onStartChat={() => setShowNewChatModal(true)} />
                )}
            </div>

            {showNewChatModal && (
                <NewChatModal
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    onSearchChange={handleSearchUsers}
                    onStartConversation={handleStartConversation}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default Messages;
