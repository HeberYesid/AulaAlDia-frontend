import React from 'react';
import { MessageSquare } from 'lucide-react';

const EmptyState = ({ onStartChat }) => {
    return (
        <div className="msg-empty-state">
            <div className="msg-empty-card">
                <div className="msg-empty-icon-wrapper">
                    <MessageSquare size={48} strokeWidth={1.5} />
                </div>
                <h3 className="msg-empty-title">Tus Mensajes</h3>
                <p className="msg-empty-description">
                    Selecciona una conversación o inicia una nueva para comenzar a chatear.
                </p>
                <button
                    className="msg-empty-cta"
                    onClick={onStartChat}
                    type="button"
                    aria-label="Iniciar nueva conversación"
                    tabIndex={0}
                >
                    Iniciar nueva conversación
                </button>
            </div>
        </div>
    );
};

export default EmptyState;
