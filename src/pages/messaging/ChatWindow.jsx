import React, { useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ROLE_LABELS = {
    STUDENT: 'Estudiante',
    TEACHER: 'Profesor',
    ADMIN: 'Admin',
};

const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today - msgDate) / 86400000);

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
};

const ChatWindow = ({
    messages,
    currentUserId,
    otherParticipant,
    newMessage,
    onNewMessageChange,
    onSendMessage,
    onBack,
}) => {
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [otherParticipant?.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSendMessage(e);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage(e);
        }
    };

    /* Group messages by date and detect consecutive same-sender runs */
    const renderMessages = () => {
        const elements = [];
        let lastDate = null;

        messages.forEach((msg, index) => {
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== lastDate) {
                elements.push(
                    <div key={`sep-${msgDate}`} className="msg-date-separator">
                        <span className="msg-date-separator-text">
                            {formatDateSeparator(msg.created_at)}
                        </span>
                    </div>
                );
                lastDate = msgDate;
            }

            const isSent = msg.sender.id === currentUserId;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showAvatar = !isSent && (!prevMsg || prevMsg.sender.id !== msg.sender.id);
            const senderInitial = msg.sender.first_name?.[0]?.toUpperCase() || msg.sender.email?.[0]?.toUpperCase() || '?';

            elements.push(
                <MessageBubble
                    key={msg.id}
                    message={msg}
                    isSent={isSent}
                    showAvatar={showAvatar}
                    senderInitial={senderInitial}
                />
            );
        });

        return elements;
    };

    return (
        <section className="msg-chat" aria-label="Área de chat">
            <div className="msg-chat-header">
                <button
                    className="msg-chat-back-btn"
                    onClick={onBack}
                    type="button"
                    aria-label="Volver a conversaciones"
                    tabIndex={0}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="msg-chat-header-avatar">
                    {otherParticipant?.first_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="msg-chat-header-info">
                    <h3 className="msg-chat-header-name">
                        {otherParticipant?.first_name} {otherParticipant?.last_name}
                    </h3>
                    {otherParticipant?.role && (
                        <span className="msg-chat-header-role">
                            {ROLE_LABELS[otherParticipant.role] || otherParticipant.role}
                        </span>
                    )}
                </div>
            </div>

            <div className="msg-chat-messages">
                {renderMessages()}
                <div ref={messagesEndRef} />
            </div>

            <form className="msg-chat-input-area" onSubmit={handleSubmit}>
                <div className="msg-chat-input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        className="msg-chat-input"
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        aria-label="Escribe un mensaje"
                    />
                    <button
                        type="submit"
                        className="msg-chat-send-btn"
                        disabled={!newMessage.trim()}
                        aria-label="Enviar mensaje"
                        tabIndex={0}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </section>
    );
};

export default ChatWindow;
