import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ConversationSummary, FriendRequestItem, NotificationItem, UserProfile } from '../types';
import NewGroupModal from './NewGroupModal';
import StatusList from './StatusList';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { MessageCircle, CircleDashed, Users, Bell, Plus, Home, Check, CheckCheck, PhoneMissed } from 'lucide-react';

type Tab = 'chats' | 'friends' | 'requests' | 'status';

interface Props {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onlineStatus: Record<string, boolean>;
  onOpenPrivateChat: (userId: string) => void;
  onGroupCreated: (conversationId: string) => void;
  friends: UserProfile[];
  refreshFriends: () => void;
  initialTab?: Tab;
}

function AvatarCircle({
  url,
  name,
  size = 42,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: url ? undefined : avatarColorFor(name),
        color: url ? undefined : '#fff',
      }}
    >
      {url ? (
        <img src={resolveFileUrl(url)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onlineStatus,
  onOpenPrivateChat,
  onGroupCreated,
  friends,
  refreshFriends,
  initialTab,
}: Props) {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab || 'chats');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);

  const loadNotifications = async () => {
    const res = await api.get('/notifications');
    setNotifications(res.data.notifications);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (n: NotificationItem) => {
      setNotifications((prev) => [n, ...prev]);
    };
    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [socket]);

  useEffect(() => {
    if (tab === 'requests') {
      loadRequests();
      const hasUnread = notifications.some((n) => !n.read);
      if (hasUnread) {
        api.post('/notifications/read-all').catch(() => {});
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (search.trim().length < 2) {
        setResults([]);
        return;
      }
      const res = await api.get('/users/search', { params: { q: search } });
      setResults(res.data.users);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadRequests = async () => {
    const res = await api.get('/friends/requests');
    setRequests(res.data.received);
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      await api.post('/friends/request', { receiverId });
      setResults((prev) => prev.filter((u) => u.id !== receiverId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    }
  };

  const respond = async (requestId: string, action: 'accept' | 'reject') => {
    await api.post('/friends/respond', { requestId, action });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    refreshFriends();
  };

  const openNotification = (n: NotificationItem) => {
    if (n.conversationId) {
      onSelectConversation(n.conversationId);
      setTab('chats');
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const bellBadgeCount = requests.length + unreadNotifCount;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Discussions</div>
        <button className="btn btn-ghost btn-icon" onClick={() => setShowNewGroup(true)} title="Nouveau groupe">
          <Plus size={18} />
        </button>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <input
          className="field"
          placeholder="Rechercher des personnes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search.trim().length >= 2 && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
          {results.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aucun résultat.</p>}
          {results.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>{u.username}</span>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => sendFriendRequest(u.id)}>
                Ajouter
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="tabs" style={{ justifyContent: 'space-around', padding: '0 4px' }}>
        <div className="tab" onClick={() => navigate('/feed')} title="Accueil / Fil d'actualité" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Home size={18} />
        </div>
        <div className={`tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')} title="Discussions" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <MessageCircle size={18} />
        </div>
        <div className={`tab ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')} title="Statuts" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <CircleDashed size={18} />
        </div>
        <div className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')} title="Amis" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Users size={18} />
        </div>
        <div className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')} title="Notifications" style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <Bell size={18} />
          {bellBadgeCount > 0 && <span className="badge" style={{ position: 'absolute', top: 2, right: 14, minWidth: 16, height: 16, fontSize: '0.62rem' }}>{bellBadgeCount > 9 ? '9+' : bellBadgeCount}</span>}
        </div>
      </div>

      {tab === 'status' && <StatusList />}

      <div style={{ flex: 1, overflowY: 'auto', display: tab === 'status' ? 'none' : 'block' }}>
        {tab === 'chats' &&
          (conversations.length === 0 ? (
            <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Aucune conversation pour l'instant. Ajoutez des amis pour commencer à discuter.
            </p>
          ) : (
            conversations.map((c) => {
              const other = !c.isGroup ? c.members.find((m) => m.id !== user?.id) : null;
              const isOnline = other ? onlineStatus[other.id] : false;
              const isUnread = c.unreadCount > 0;
              const lastMessageIsMine = c.lastMessage?.senderId === user?.id;
              return (
                <div
                  key={c.id}
                  className={`conversation-item ${activeConversationId === c.id ? 'active' : ''}`}
                  onClick={() => onSelectConversation(c.id)}
                >
                  <div style={{ position: 'relative' }}>
                    <AvatarCircle url={c.avatarUrl} name={c.name || '?'} />
                    {!c.isGroup && (
                      <div className={`presence-dot ${isOnline ? 'online' : ''}`} style={{ position: 'absolute', right: -1, bottom: -1 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isUnread ? 700 : 600, fontSize: '0.92rem' }}>{c.name}</div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: isUnread ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: isUnread ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {lastMessageIsMine && c.lastMessage && (
                        c.lastMessageSeenByOther ? (
                          <CheckCheck size={13} color="#12a389" style={{ flexShrink: 0 }} />
                        ) : (
                          <Check size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        )
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.lastMessage?.type === 'text' ? c.lastMessage.content : c.lastMessage ? 'Pièce jointe' : 'Nouvelle conversation'}
                      </span>
                    </div>
                  </div>
                  {isUnread && (
                    <span
                      className="badge"
                      style={{
                        minWidth: 20,
                        height: 20,
                        fontSize: '0.7rem',
                        background: '#12a389',
                        flexShrink: 0,
                      }}
                    >
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          ))}

        {tab === 'friends' &&
          (friends.length === 0 ? (
            <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Vous n'avez pas encore d'amis. Utilisez la recherche pour en ajouter.
            </p>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="conversation-item" onClick={() => onOpenPrivateChat(f.id)}>
                <div
                  style={{ position: 'relative' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${f.id}`);
                  }}
                >
                  <AvatarCircle url={f.avatarUrl} name={f.username} />
                  <div className={`presence-dot ${onlineStatus[f.id] ? 'online' : ''}`} style={{ position: 'absolute', right: -1, bottom: -1 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{f.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{onlineStatus[f.id] ? 'En ligne' : 'Hors ligne'}</div>
                </div>
              </div>
            ))
          ))}

        {tab === 'requests' && (
          <div>
            {requests.length === 0 && notifications.length === 0 && (
              <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>Rien à signaler pour l'instant.</p>
            )}

            {requests.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Demandes d'amis
                </div>
                {requests.map((r) => (
                  <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <AvatarCircle url={r.sender.avatarUrl} name={r.sender.username} size={36} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.sender.username}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '6px' }} onClick={() => respond(r.id, 'accept')}>Accepter</button>
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => respond(r.id, 'reject')}>Refuser</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {notifications.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Notifications
                </div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="conversation-item"
                    style={{ cursor: n.conversationId ? 'pointer' : 'default', opacity: n.read ? 0.7 : 1 }}
                    onClick={() => openNotification(n)}
                  >
                    {n.type === 'missed_call' ? (
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 999,
                          background: 'rgba(211, 47, 47, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <PhoneMissed size={18} color="#c62828" />
                      </div>
                    ) : (
                      <AvatarCircle url={n.fromUser?.avatarUrl} name={n.fromUser?.username || n.title} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.9rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.body}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {user?.isAdmin && (
        <Link to="/admin/invitations" className="btn btn-ghost" style={{ margin: 12, justifyContent: 'flex-start' }}>
          🛠️ Administration des invitations
        </Link>
      )}

      {showNewGroup && (
        <NewGroupModal
          friends={friends}
          onClose={() => setShowNewGroup(false)}
          onCreated={(id) => {
            setShowNewGroup(false);
            onGroupCreated(id);
          }}
        />
      )}
    </div>
  );
        }
