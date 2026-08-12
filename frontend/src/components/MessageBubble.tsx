import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Message } from '../types';
import { resolveFileUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';
import { Download, Play, Phone, Video, PhoneMissed, X } from 'lucide-react';

interface Props {
  message: Message;
  isMine: boolean;
  showSender: boolean;
  otherUserId?: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
        <span>{label}</span>
        <span style={{ opacity: 0.6, fontWeight: 400 }}>· {formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

// Zoom plein écran pour une image ou une vidéo, en dehors du flux de la page
function Lightbox({ type, url, onClose }: { type: 'image' | 'video'; url: string; onClose: () => void }) {
  return createPortal(
    <div className="call-overlay" style={{ padding: 20, zIndex: 300 }} onClick={onClose}>
      <button
        className="btn btn-ghost btn-icon"
        style={{ position: 'absolute', top: 16, right: 16, color: '#fff' }}
        onClick={onClose}
      >
        <X size={22} />
      </button>
      {type === 'image' ? (
        <img
          src={url}
          alt=""
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <video
          src={url}
          controls
          autoPlay
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>,
    document.body
  );
}

export default function MessageBubble({ message, isMine, showSender, otherUserId }: Props) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [lightbox, setLightbox] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [showMetaDetail, setShowMetaDetail] = useState(false);

  if (message.type === 'system') {
    return <CallSystemMessage message={message} isMine={isMine} />;
  }

  const time = formatTime(message.createdAt);

  const autoDownload = user?.mediaAutoDownload !== false;
  const isMedia = message.type === 'image' || message.type === 'video';
  const shouldShowMedia = !isMedia || autoDownload || revealed;
  const isMediaBubble = isMedia && shouldShowMedia && !message.deleted;

  // Heure de lecture par l'autre personne, si connue (conversation privée uniquement)
  let seenAt: string | null = null;
  if (isMine && otherUserId && message.seenBy) {
    try {
      const seenMap = JSON.parse(message.seenBy);
      if (seenMap && typeof seenMap === 'object' && seenMap[otherUserId]) {
        seenAt = seenMap[otherUserId];
      }
    } catch {
      /* ancien format ou données invalides : on ignore silencieusement */
    }
  }

  return (
    <div className={`bubble-row ${isMine ? 'mine' : 'theirs'}`}>
      <div>
        {showSender && !isMine && message.sender && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2, marginLeft: 4 }}>
            {message.sender.username}
          </div>
        )}
        <div className={`bubble ${isMediaBubble ? 'media-bubble' : ''}`}>
          {message.deleted ? (
            <em style={{ opacity: 0.7 }}>Message supprimé</em>
          ) : (
            <>
              {message.type === 'image' && message.fileUrl && (
                shouldShowMedia ? (
                  <div className="media-wrapper" onClick={() => setLightbox({ type: 'image', url: resolveFileUrl(message.fileUrl!) })}>
                    <img src={resolveFileUrl(message.fileUrl)} alt="" style={{ display: 'block', width: '100%' }} />
                  </div>
                ) : (
                  <div
                    onClick={() => setRevealed(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 10px', cursor: 'pointer', background: 'var(--bg-sunken)', borderRadius: 10 }}
                  >
                    <Download size={18} /> Appuyer pour afficher la photo
                  </div>
                )
              )}
              {message.type === 'video' && message.fileUrl && (
                shouldShowMedia ? (
                  <div
                    className="media-wrapper"
                    onClick={() => setLightbox({ type: 'video', url: resolveFileUrl(message.fileUrl!) })}
                  >
                    <video
                      src={resolveFileUrl(message.fileUrl)}
                      preload="metadata"
                      style={{ display: 'block', width: '100%' }}
                      onLoadedMetadata={(e) => setVideoDuration((e.target as HTMLVideoElement).duration)}
                    />
                    <div className="video-play-overlay">
                      <Play size={22} fill="#fff" color="#fff" />
                    </div>
                    {videoDuration != null && (
                      <div className="video-duration-badge">{formatDuration(videoDuration)}</div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => setRevealed(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 10px', cursor: 'pointer', background: 'var(--bg-sunken)', borderRadius: 10 }}
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
              {message.content && message.type !== 'image' && message.type !== 'video' && <span>{message.content}</span>}
              {message.content && isMediaBubble && (
                <div style={{ padding: '8px 12px 4px' }}>{message.content}</div>
              )}
            </>
          )}
        </div>
        <div
          className={`bubble-meta ${isMine ? 'mine' : ''}`}
          style={{ textAlign: isMine ? 'right' : 'left', cursor: isMine ? 'pointer' : 'default' }}
          onClick={() => isMine && setShowMetaDetail((v) => !v)}
        >
          {time}
        </div>
        {isMine && showMetaDetail && (
          <div className={`message-meta-detail ${isMine ? 'mine' : ''}`}>
            Envoyé à {time}
            {seenAt && <> · Vu à {formatTime(seenAt)}</>}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox type={lightbox.type} url={lightbox.url} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
               }
