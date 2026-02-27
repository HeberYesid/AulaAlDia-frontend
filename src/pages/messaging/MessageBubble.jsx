import React from 'react';

const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const MessageBubble = ({ message, isSent, showAvatar, senderInitial }) => {
    const bubbleClass = isSent ? 'msg-bubble-sent' : 'msg-bubble-received';

    return (
        <div className={`msg-bubble-row ${isSent ? 'msg-bubble-row-sent' : 'msg-bubble-row-received'}`}>
            {!isSent && (
                <div className={`msg-bubble-avatar ${showAvatar ? '' : 'msg-bubble-avatar-hidden'}`}>
                    {showAvatar && <span>{senderInitial}</span>}
                </div>
            )}
            <div className={`msg-bubble ${bubbleClass}`}>
                <p className="msg-bubble-content">{message.content}</p>
                <span className="msg-bubble-time">{formatTime(message.created_at)}</span>
            </div>
        </div>
    );
};

export default MessageBubble;
