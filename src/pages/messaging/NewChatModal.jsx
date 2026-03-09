import React, { useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const ROLE_LABELS = {
    STUDENT: 'Estudiante',
    TEACHER: 'Profesor',
    ADMIN: 'Admin',
};

const NewChatModal = ({ searchQuery, searchResults, onSearchChange, onStartConversation, onClose }) => {
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="msg-modal-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-label="Nueva conversación"
        >
            <div className="msg-modal" ref={modalRef}>
                <div className="msg-modal-header">
                    <h3 className="msg-modal-title">Nueva Conversación</h3>
                    <button
                        className="msg-modal-close"
                        onClick={onClose}
                        type="button"
                        aria-label="Cerrar modal"
                        tabIndex={0}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="msg-modal-search-wrapper">
                    <Search size={18} className="msg-modal-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        name="user-search"
                        autoComplete="off"
                        className="msg-modal-search-input"
                        placeholder="Buscar por nombre o correo…"
                        value={searchQuery}
                        onChange={onSearchChange}
                        aria-label="Buscar usuario"
                    />
                </div>

                <div className="msg-modal-results">
                    {searchResults.length === 0 && searchQuery.length > 2 && (
                        <div className="msg-modal-no-results">
                            No se encontraron usuarios
                        </div>
                    )}
                    {searchResults.map((u) => (
                        <button
                            key={u.id}
                            className="msg-modal-user-item"
                            onClick={() => onStartConversation(u.id)}
                            type="button"
                            tabIndex={0}
                            aria-label={`Iniciar conversación con ${u.first_name} ${u.last_name}`}
                        >
                            <div className="msg-modal-user-avatar">
                                {u.first_name?.[0] || u.email?.[0]}
                            </div>
                            <div className="msg-modal-user-info">
                                <span className="msg-modal-user-name">
                                    {u.first_name} {u.last_name}
                                </span>
                                <span className="msg-modal-user-email">{u.email}</span>
                            </div>
                            {u.role && (
                                <span className="msg-modal-user-role">
                                    {ROLE_LABELS[u.role] || u.role}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;
