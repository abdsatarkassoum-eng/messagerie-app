 import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConversationSummary, Message } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { resolveFileUrl } from '../utils/url';
import { ArrowLeft, Phone, Video } from 'lucide-react';

interface Props {
  conversation: ConversationSummary;
  messages: Message[];
  typingUsers: string[];
  onlineStatus: Record<string, boolean>;
  onSendText: (content: string) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  onStartCall: (callType: 'audio' | 'video') => void;
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  messages,
  typingUsers,
  onlineStatus,
  onSendText,
  onSendFile,
  onTyping,
  onStartCall,
  onBack,
}: Props) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const other = !conversation.isGroup ? conversation.members.find((m) => m.id !== user?.id) : null;
  const isOnline = other ? onlineStatus[other.id] : false;

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button className="btn btn-ghost btn-icon" onClick={onBack}><ArrowLeft size={18} /></button>
          )}
          <div className="avatar" style={{ width: 40, height: 40 }}>
            {conversation.avatarUrl ? (
              <img src={resolveFileUrl(conversation.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              conversation.name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{conversation.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {conversation.isGroup
                ? `${conversation.members.length} membres`
                : isOnline
                ? 'En ligne'
                : 'Hors ligne'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-icon" title="Appel audio" onClick={() => onStartCall('audio')}><Phone size={18} /></button>
          <button className="btn btn-ghost btn-icon" title="Appel vidéo" onClick={() => onStartCall('video')}><Video size={18} /></button>
        </div>
      </div>

      <div className="messages-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '2rem' }}>💬</div>
            <p>Dites bonjour ! Envoyez votre premier message à {conversation.name}.</p>
          </div>
        )}
        {messages.map((m, idx) => {
          const mineId = m.sender?.id || m.senderId;
          const isMine = !!mineId && !!user?.id && String(mineId) === String(user.id);
          const showSender = conversation.isGroup && (idx === 0 || messages[idx - 1].senderId !== m.senderId);
          return <MessageBubble key={m.id} message={m} isMine={isMine} showSender={showSender} />;
        })}
        {typingUsers.length > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px 8px' }}>
            {typingUsers.length === 1 ? 'écrit…' : `${typingUsers.length} personnes écrivent…`}
          </div>
        )}
      </div>

      <MessageInput onSend={onSendText} onSendFile={onSendFile} onTyping={onTyping} />
    </div>
  );
}
