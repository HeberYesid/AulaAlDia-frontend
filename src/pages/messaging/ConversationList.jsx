import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';

const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[date.getDay()];
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const ConversationList = ({
    conversations,
    selectedConversation,
    currentUserId,
    onSelectConversation,
    onNewChat,
}) => {
    const [filterQuery, setFilterQuery] = useState('');

    const getOtherParticipant = (conversation) => {
        return conversation.participants.find((p) => p.id !== currentUserId) || {};
    };

    const filteredConversations = conversations.filter((conv) => {
        if (!filterQuery.trim()) return true;
        const other = getOtherParticipant(conv);
        const fullName = `${other.first_name || ''} ${other.last_name || ''}`.toLowerCase();
        return fullName.includes(filterQuery.toLowerCase());
    });

    const handleClearFilter = () => {
        setFilterQuery('');
    };

    return (
        <aside className="msg-sidebar" aria-label="Lista de conversaciones">
            <div className="msg-sidebar-header">
                <h2 className="msg-sidebar-title">Mensajes</h2>
                <button
                    className="msg-new-chat-btn"
                    onClick={onNewChat}
                    type="button"
                    aria-label="Nueva conversación"
                    tabIndex={0}
                    title="Nueva conversación"
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
            </div>

            <div className="msg-sidebar-search">
                <Search size={16} className="msg-sidebar-search-icon" />
                <input
                    type="text"
                    className="msg-sidebar-search-input"
                    placeholder="Buscar conversación..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    aria-label="Filtrar conversaciones"
                />
                {filterQuery && (
                    <button
                        className="msg-sidebar-search-clear"
                        onClick={handleClearFilter}
                        type="button"
                        aria-label="Limpiar búsqueda"
                        tabIndex={0}
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="msg-conversation-list" role="listbox" aria-label="Conversaciones">
                {filteredConversations.length === 0 && (
                    <div className="msg-conversation-empty">
                        {filterQuery ? 'Sin resultados' : 'No hay conversaciones'}
                    </div>
                )}
                {filteredConversations.map((conv) => {
                    const other = getOtherParticipant(conv);
                    const isActive = selectedConversation?.id === conv.id;
                    const hasUnread = conv.unread_count > 0;
                    const lastMsgTime = conv.last_message?.created_at || conv.updated_at;
                    const preview = conv.last_message
                        ? conv.last_message.content.substring(0, 40)
                        : 'No hay mensajes';

                    return (
                        <button
                            key={conv.id}
                            className={`msg-conversation-item ${isActive ? 'msg-conversation-active' : ''} ${hasUnread ? 'msg-conversation-unread' : ''}`}
                            onClick={() => onSelectConversation(conv)}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            tabIndex={0}
                        >
                            <div className="msg-avatar">
                                <span className="msg-avatar-letter">
                                    {other.first_name?.[0]?.toUpperCase() || other.email?.[0]?.toUpperCase() || '?'}
                                </span>
                            </div>
                            <div className="msg-conversation-info">
                                <div className="msg-conversation-top-row">
                                    <span className={`msg-conversation-name ${hasUnread ? 'msg-conversation-name-bold' : ''}`}>
                                        {other.first_name} {other.last_name}
                                    </span>
                                    <span className="msg-conversation-time">
                                        {formatRelativeTime(lastMsgTime)}
                                    </span>
                                </div>
                                <div className="msg-conversation-bottom-row">
                                    <span className="msg-conversation-preview">{preview}</span>
                                    {hasUnread && (
                                        <span className="msg-unread-indicator" aria-label={`${conv.unread_count} mensajes sin leer`}>
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default ConversationList;
