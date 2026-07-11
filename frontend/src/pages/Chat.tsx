import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ConversationSummary, Message, UserProfile } from '../types';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal, { CallSession } from '../components/CallModal';

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>({});
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [typingByConv, setTypingByConv] = useState<Record<string, string[]>>({});
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const loadConversations = async () => {
    const res = await api.get('/conversations');
    setConversations(res.data.conversations);
    const initialStatus: Record<string, boolean> = {};
    res.data.conversations.forEach((c: ConversationSummary) => {
      c.members.forEach((m) => {
        initialStatus[m.id] = m.status === 'online';
      });
    });
    setOnlineStatus((prev) => ({ ...initialStatus, ...prev }));
  };

  const loadFriends = async () => {
    const res = await api.get('/friends');
    setFriends(res.data.friends);
  };

  useEffect(() => {
    loadConversations();
    loadFriends();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (msg: Message) => {
      setMessagesByConv((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg],
      }));
      loadConversations();
      if (msg.conversationId === activeIdRef.current && msg.id) {
        api.post(`/messages/${msg.id}/seen`).catch(() => {});
      }
    });

    socket.on('message:deleted', ({ id, conversationId }: any) => {
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m.id === id ? { ...m, deleted: true, content: null, fileUrl: null } : m
        ),
      }));
    });

    socket.on('presence:update', ({ userId, status }: any) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: status === 'online' }));
    });

    socket.on('typing:update', ({ conversationId, userId, isTyping }: any) => {
      setTypingByConv((prev) => {
        const current = new Set(prev[conversationId] || []);
        if (isTyping) current.add(userId);
        else current.delete(userId);
        return { ...prev, [conversationId]: Array.from(current) };
      });
    });

    socket.on('friend_request:accepted', () => loadFriends());

    socket.on('call:incoming', ({ fromUserId, offer, callType }: any) => {
      const peer =
        friends.find((f) => f.id === fromUserId) ||
        conversations.flatMap((c) => c.members).find((m) => m.id === fromUserId);
      if (peer) {
        setCallSession({ isIncoming: true, callType, peer, offer });
      }
    });

    return () => {
      socket.off('message:new');
      socket.off('message:deleted');
      socket.off('presence:update');
      socket.off('typing:update');
      socket.off('friend_request:accepted');
      socket.off('call:incoming');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, friends, conversations]);

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setMobileShowChat(true);
    if (!messagesByConv[id]) {
      const res = await api.get(`/conversations/${id}/messages`);
      setMessagesByConv((prev) => ({ ...prev, [id]: res.data.messages }));
    }
    socket?.emit('conversation:join', { conversationId: id });
  };

  const openPrivateChat = async (userId: string) => {
    const res = await api.post('/conversations/private', { userId });
    await loadConversations();
    await selectConversation(res.data.conversationId);
  };

  const handleGroupCreated = async (conversationId: string) => {
    await loadConversations();
    socket?.emit('conversation:join', { conversationId });
    await selectConversation(conversationId);
  };

  const sendText = async (content: string) => {
    if (!activeId) return;
    await api.post('/messages', { conversationId: activeId, content, type: 'text' });
  };

  const sendFile = async (file: File) => {
    if (!activeId) return;
    const formData = new FormData();
    formData.append('conversationId', activeId);
    formData.append('file', file);
    await api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeId) return;
    socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId: activeId });
  };

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const startCall = (callType: 'audio' | 'video') => {
    if (!activeConversation || activeConversation.isGroup) {
      alert('Les appels sont pour l\'instant disponibles uniquement en conversation privée.');
      return;
    }
    const peer = activeConversation.members.find((m) => m.id !== user?.id);
    if (!peer) return;
    setCallSession({ isIncoming: false, callType, peer });
  };

  return (
    <div className="app-shell">
      <div className={mobileShowChat ? 'sidebar hidden-mobile' : 'sidebar'}>
        <Sidebar
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={selectConversation}
          onlineStatus={onlineStatus}
          onOpenPrivateChat={openPrivateChat}
          onGroupCreated={handleGroupCreated}
          friends={friends}
          refreshFriends={loadFriends}
        />
      </div>

      <div className={mobileShowChat ? 'chat-area' : 'chat-area hidden-mobile'} style={{ display: mobileShowChat || activeConversation ? 'flex' : undefined }}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messagesByConv[activeConversation.id] || []}
            typingUsers={(typingByConv[activeConversation.id] || []).filter((id) => id !== user?.id)}
            onlineStatus={onlineStatus}
            onSendText={sendText}
            onSendFile={sendFile}
            onTyping={handleTyping}
            onStartCall={startCall}
            onBack={() => setMobileShowChat(false)}
          />
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '2.4rem' }}>👋</div>
            <h2 style={{ margin: 0 }}>Bienvenue sur FriEnds{user ? `, ${user.username}` : ''}</h2>
            <p>Sélectionnez une conversation ou commencez-en une nouvelle avec un ami.</p>
          </div>
        )}
      </div>

      {callSession && socket && (
        <CallModal socket={socket} session={callSession} onClose={() => setCallSession(null)} />
      )}
    </div>
  );
}
