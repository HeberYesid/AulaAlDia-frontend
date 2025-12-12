import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../state/AuthContext';
import { getConversations, getMessages, sendMessage, startConversation, searchUsers, markAsRead } from '../../api/messaging';
import './Messages.css';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const messagesEndRef = useRef(null);

    // Poll for conversations
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    // Poll for messages when a conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            const interval = setInterval(() => fetchMessages(selectedConversation.id), 5000); // Poll faster for active chat
            return () => clearInterval(interval);
        }
    }, [selectedConversation]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const data = await getMessages(conversationId);
            setMessages(data);
            // Mark as read if we have unread messages
            // This is a simple implementation; ideally we check if window is focused
            await markAsRead(conversationId);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await sendMessage(selectedConversation.id, newMessage);
            setNewMessage('');
            fetchMessages(selectedConversation.id);
            fetchConversations(); // Update last message in list
        } catch (error) {
            console.error("Error sending message:", error);
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
                console.error("Error searching users:", error);
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
            fetchConversations();
        } catch (error) {
            console.error("Error starting conversation:", error);
        }
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants.find(p => p.id !== user.id) || {};
    };

    return (
        <div className="messages-container">
            <div className="conversations-sidebar">
                <div className="sidebar-header">
                    <h2>Mensajes</h2>
                    <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>+</button>
                </div>
                <div className="conversations-list">
                    {conversations.map(conv => {
                        const other = getOtherParticipant(conv);
                        return (
                            <div 
                                key={conv.id} 
                                className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
                                onClick={() => setSelectedConversation(conv)}
                            >
                                <div className="avatar">{other.first_name?.[0] || other.email?.[0]}</div>
                                <div className="conv-info">
                                    <div className="conv-name">{other.first_name} {other.last_name}</div>
                                    <div className="conv-last-msg">
                                        {conv.last_message ? conv.last_message.content.substring(0, 30) : 'No hay mensajes'}
                                    </div>
                                </div>
                                {conv.unread_count > 0 && <div className="unread-badge">{conv.unread_count}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="chat-area">
                {selectedConversation ? (
                    <>
                        <div className="chat-header">
                            <h3>{getOtherParticipant(selectedConversation).first_name} {getOtherParticipant(selectedConversation).last_name}</h3>
                        </div>
                        <div className="messages-list">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message-bubble ${msg.sender.id === user.id ? 'sent' : 'received'}`}>
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="message-input-area" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                placeholder="Escribe un mensaje..." 
                            />
                            <button type="submit">Enviar</button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="empty-state-content">
                            <div className="empty-state-icon">💬</div>
                            <h3>Tus Mensajes</h3>
                            <p>Selecciona una conversación o inicia una nueva para comenzar a chatear.</p>
                            <button className="start-chat-btn" onClick={() => setShowNewChatModal(true)}>
                                Iniciar nueva conversación
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showNewChatModal && (
                <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Nueva Conversación</h3>
                        <input 
                            type="text" 
                            placeholder="Buscar usuario..." 
                            value={searchQuery}
                            onChange={handleSearchUsers}
                            autoFocus
                        />
                        <div className="search-results">
                            {searchResults.map(u => (
                                <div key={u.id} className="search-result-item" onClick={() => handleStartConversation(u.id)}>
                                    {u.first_name} {u.last_name} ({u.email})
                                </div>
                            ))}
                        </div>
                        <button className="close-modal" onClick={() => setShowNewChatModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
