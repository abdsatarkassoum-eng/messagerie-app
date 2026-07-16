import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import TopNav from '../components/TopNav';
import PostCard from '../components/PostCard';
import { FullProfile } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { ArrowLeft, MessageCircle, UserPlus, Clock, Users } from 'lucide-react';

type Tab = 'posts' | 'groups';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    if (!id) return;
    api.get(`/users/${id}/profile`).then((res) => setProfile(res.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openChat = async () => {
    if (!id) return;
    const res = await api.post('/conversations/private', { userId: id });
    navigate('/', { state: { openConversationId: res.data.conversationId } });
  };

  const sendFriendRequest = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post('/friends/request', { receiverId: id });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="app-root">
        <TopNav />
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement du profil…</p>
      </div>
    );
  }

  const { user, relationship, friendCount, groups, canViewPosts, posts } = profile;

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', height: 'calc(100vh - 58px)' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
          <div
            className="avatar-ring"
            style={{ width: 96, height: 96, margin: '0 auto 14px' }}
          >
            <div
              className="avatar"
              style={{ width: '100%', height: '100%', fontSize: '2rem', background: user.avatarUrl ? undefined : avatarColorFor(user.username), color: '#fff' }}
            >
              {user.avatarUrl ? (
                <img src={resolveFileUrl(user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
              ) : (
                user.username[0]?.toUpperCase()
              )}
            </div>
          </div>

          <h2 style={{ margin: '0 0 4px' }}>{user.username}</h2>
          {user.bio && <p style={{ color: 'var(--text-muted)', margin: '0 0 14px', fontSize: '0.9rem' }}>{user.bio}</p>}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{friendCount}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Amis</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{groups.length}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Groupes</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{posts.length}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Publications</div>
            </div>
          </div>

          {relationship === 'self' && (
            <button className="btn btn-secondary" onClick={() => navigate('/settings')} style={{ width: '100%' }}>
              Modifier mon profil
            </button>
          )}
          {relationship === 'friends' && (
            <button className="btn btn-primary" onClick={openChat} style={{ width: '100%' }}>
              <MessageCircle size={16} /> Envoyer un message
            </button>
          )}
          {relationship === 'none' && (
            <button className="btn btn-primary" onClick={sendFriendRequest} disabled={actionLoading} style={{ width: '100%' }}>
              <UserPlus size={16} /> Ajouter en ami
            </button>
          )}
          {relationship === 'pending_sent' && (
            <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
              <Clock size={16} /> Demande envoyée
            </button>
          )}
          {relationship === 'pending_received' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Cette personne vous a envoyé une demande d'ami — répondez depuis les notifications 🔔
            </p>
          )}
        </div>

        <div className="tabs" style={{ marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>Publications</div>
          <div className={`tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>Groupes</div>
        </div>

        {tab === 'posts' && (
          <>
            {!canViewPosts && (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Ce contenu est réservé aux amis de {user.username}.
              </div>
            )}
            {canViewPosts && posts.length === 0 && (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Aucune publication pour l'instant.
              </div>
            )}
            {canViewPosts && posts.map((p) => (
              <PostCard key={p.id} post={p} onDeleted={() => load()} />
            ))}
          </>
        )}

        {tab === 'groups' && (
          <>
            {groups.length === 0 && (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Aucun groupe pour l'instant.
              </div>
            )}
            {groups.map((g) => (
              <div key={g.id} className="card" style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="avatar"
                  style={{ width: 44, height: 44, background: g.avatarUrl ? undefined : avatarColorFor(g.name), color: '#fff' }}
                >
                  {g.avatarUrl ? (
                    <img src={resolveFileUrl(g.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                  ) : (
                    <Users size={18} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{g.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {g.memberCount} membre{g.memberCount > 1 ? 's' : ''}
                    {g.createdByThisUser && ' · Créateur'}
                  </div>
                </div>
                {g.viewerIsMember ? (
                  <button className="btn btn-secondary" onClick={() => navigate('/')}>Ouvrir</button>
                ) : (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Sur invitation</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
