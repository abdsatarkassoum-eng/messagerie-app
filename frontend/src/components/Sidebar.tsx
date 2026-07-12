 import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConversationSummary, FriendRequestItem, UserProfile } from '../types';
import NewGroupModal from './NewGroupModal';
import StatusList from './StatusList';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { MessageCircle, CircleDashed, Users, Bell, Plus } from 'lucide-react';

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

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onlineStatus,
  onOpenPrivateChat,
  onGroupCreated,
  friends,
  refreshFriends,
}: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('chats');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    if (tab === 'requests') loadRequests();
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

      <div className="tabs">
        <div className={`tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
          <span className="tab-icon-row"><MessageCircle size={16} /> Discussions</span>
        </div>
        <div className={`tab ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>
          <span className="tab-icon-row"><CircleDashed size={16} /> Statuts</span>
        </div>
        <div className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          <span className="tab-icon-row"><Users size={16} /> Amis</span>
        </div>
        <div className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          <span className="tab-icon-row">
            <Bell size={16} /> Demandes {requests.length > 0 && <span className="badge">{requests.length}</span>}
          </span>
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
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.lastMessage?.type === 'text' ? c.lastMessage.content : c.lastMessage ? 'Pièce jointe' : 'Nouvelle conversation'}
                    </div>
                  </div>
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
                <div style={{ position: 'relative' }}>
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

        {tab === 'requests' &&
          (requests.length === 0 ? (
            <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aucune demande en attente.</p>
          ) : (
            requests.map((r) => (
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
            ))
          ))}
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
