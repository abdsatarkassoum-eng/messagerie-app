import React, { useState } from 'react';
import { Message } from '../types';
import { resolveFileUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';
import { Download, Play, Phone, Video, PhoneMissed, PhoneOff } from 'lucide-react';

interface Props {
  message: Message;
  isMine: boolean;
  showSender: boolean;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function CallSystemMessage({ message, isMine }: { message: Message; isMine: boolean }) {
  let data: { kind?: string; callType?: 'audio' | 'video'; outcome?: string; durationSeconds?: number } = {};
  try {
    data = JSON.parse(message.content || '{}');
  } catch {
    data = {};
  }
  if (data.kind !== 'call') return null;

  const isVideo = data.callType === 'video';
  const isMissedOrDeclined = data.outcome === 'missed' || data.outcome === 'declined';

  const Icon = isMissedOrDeclined ? PhoneMissed : isVideo ? Video : Phone;

  let label: string;
  if (data.outcome === 'completed') {
    label = `${isVideo ? 'Appel vidéo' : 'Appel audio'} · ${formatDuration(data.durationSeconds || 0)}`;
  } else if (data.outcome === 'declined') {
    label = `${isVideo ? 'Appel vidéo' : 'Appel audio'} refusé`;
  } else {
    label = `${isVideo ? 'Appel vidéo' : 'Appel audio'} manqué`;
  }

  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 999,
          background: isMissedOrDeclined ? 'rgba(211, 47, 47, 0.1)' : 'var(--bg-sunken)',
          color: isMissedOrDeclined ? '#c62828' : 'var(--text-muted)',
          fontSize: '0.82rem',
          fontWeight: 600,
        }}
      >
        <Icon size={15} />
        <span>{isMine ? label : `${label}`}</span>
        <span style={{ opacity: 0.6, fontWeight: 400 }}>· {time}</span>
      </div>
    </div>
  );
}

export default function MessageBubble({ message, isMine, showSender }: Props) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  // Message système "appel" : affichage spécial centré, pas une bulle classique
  if (message.type === 'system') {
    return <CallSystemMessage message={message} isMine={isMine} />;
  }

  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const autoDownload = user?.mediaAutoDownload !== false;
  const isMedia = message.type === 'image' || message.type === 'video';
  const shouldShowMedia = !isMedia || autoDownload || revealed;

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
                shouldShowMedia ? (
                  <img src={resolveFileUrl(message.fileUrl)} alt="image" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: message.content ? 6 : 0 }} />
                ) : (
                  <div
                    onClick={() => setRevealed(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 10px', cursor: 'pointer', background: 'var(--bg-sunken)', borderRadius: 10, marginBottom: message.content ? 6 : 0 }}
                  >
                    <Download size={18} /> Appuyer pour afficher la photo
                  </div>
                )
              )}
              {message.type === 'video' && message.fileUrl && (
                shouldShowMedia ? (
                  <video src={resolveFileUrl(message.fileUrl)} controls style={{ maxWidth: '100%', borderRadius: 10, marginBottom: message.content ? 6 : 0 }} />
                ) : (
                  <div
                    onClick={() => setRevealed(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 10px', cursor: 'pointer', background: 'var(--bg-sunken)', borderRadius: 10, marginBottom: message.content ? 6 : 0 }}
                  >
                    <Play size={18} /> Appuyer pour lire la vidéo
                  </div>
                )
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
