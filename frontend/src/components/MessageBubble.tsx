import React from 'react';
import { Message, UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';

interface Props {
  message: Message;
  isMine: boolean;
  showSender: boolean;
}

export default function MessageBubble({ message, isMine, showSender }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`bubble-row ${isMine ? 'mine' : 'theirs'}`}>
      <div>
        {showSender && !isMine && message.sender && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2, marginLeft: 4 }}>
            {message.sender.username}
          </div>
        )}
        <div className="bubble">
          {message.deleted ? (
            <em style={{ opacity: 0.7 }}>Message supprimé</em>
          ) : (
            <>
              {message.type === 'image' && message.fileUrl && (
                <img src={resolveFileUrl(message.fileUrl)} alt="image" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: message.content ? 6 : 0 }} />
              )}
              {message.type === 'video' && message.fileUrl && (
                <video src={resolveFileUrl(message.fileUrl)} controls style={{ maxWidth: '100%', borderRadius: 10, marginBottom: message.content ? 6 : 0 }} />
              )}
              {message.type === 'audio' && message.fileUrl && (
                <audio src={resolveFileUrl(message.fileUrl)} controls style={{ marginBottom: message.content ? 6 : 0 }} />
              )}
              {message.type === 'file' && message.fileUrl && (
                <a
                  href={resolveFileUrl(message.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'underline' }}
                >
                  📎 {message.fileName || 'Document'}
                </a>
              )}
              {message.content && <span>{message.content}</span>}
            </>
          )}
        </div>
        <div className={`bubble-meta ${isMine ? 'mine' : ''}`} style={{ textAlign: isMine ? 'right' : 'left' }}>
          {time}
        </div>
      </div>
    </div>
  );
}
