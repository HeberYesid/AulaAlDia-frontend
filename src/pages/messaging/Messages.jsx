import React, { startTransition, useState, useEffect, useCallback, useRef } from 'react';
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
    const searchRequestIdRef = useRef(0);

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
        const refreshConversations = () => {
            if (document.visibilityState !== 'visible') return;
            fetchConversations();
        };

        refreshConversations();
        const interval = window.setInterval(refreshConversations, 10000);

        document.addEventListener('visibilitychange', refreshConversations);
        window.addEventListener('focus', refreshConversations);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', refreshConversations);
            window.removeEventListener('focus', refreshConversations);
        };
    }, [fetchConversations]);

    useEffect(() => {
        if (!selectedConversation) return;

        const refreshMessages = () => {
            if (document.visibilityState !== 'visible') return;
            fetchMessages(selectedConversation.id);
        };

        refreshMessages();
        const interval = window.setInterval(refreshMessages, 5000);

        document.addEventListener('visibilitychange', refreshMessages);
        window.addEventListener('focus', refreshMessages);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', refreshMessages);
            window.removeEventListener('focus', refreshMessages);
        };
    }, [selectedConversation, fetchMessages]);

    useEffect(() => {
        const query = searchQuery.trim();
        const requestId = ++searchRequestIdRef.current;

        if (query.length <= 2) {
            setSearchResults([]);
            return undefined;
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                const results = await searchUsers(query);

                if (requestId !== searchRequestIdRef.current) return;

                startTransition(() => {
                    setSearchResults(results);
                });
            } catch (error) {
                if (requestId !== searchRequestIdRef.current) return;
                console.error('Error searching users:', error);
            }
        }, 250);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchQuery]);

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

    const handleSearchUsers = (e) => {
        setSearchQuery(e.target.value);
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
