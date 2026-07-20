import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import TopNav from '../components/TopNav';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import CatalogTab from '../components/CatalogTab';
import FriendsListModal from '../components/FriendsListModal';
import ProfileModal from '../components/ProfileModal';
import { FullProfile, PostItem } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import {
  ArrowLeft, MessageCircle, UserPlus, Clock, Users,
  FileText, Store, Briefcase, X,
} from 'lucide-react';

type Tab = 'posts' | 'groups' | 'products' | 'services';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [actionLoading, setActionLoading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState<null | 'friends' | 'followers'>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

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

  if (!profile || !id) {
    return (
      <div className="app-root">
        <TopNav />
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement du profil…</p>
      </div>
    );
  }

  const { user, relationship, friendCount, groups, canViewPosts, posts } = profile;
  const totalLikes = canViewPosts ? posts.reduce((sum, p) => sum + p.likesCount, 0) : 0;
  const isSelf = relationship === 'self';

  const TABS: { id: Tab; icon: React.ReactNode; title: string }[] = [
    { id: 'posts', icon: <FileText size={18} />, title: 'Publications' },
    { id: 'groups', icon: <Users size={18} />, title: 'Groupes' },
    { id: 'products', icon: <Store size={18} />, title: 'Catalogue' },
    { id: 'services', icon: <Briefcase size={18} />, title: 'Services' },
  ];

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
            style={{ width: 96, height: 96, margin: '0 auto 14px', cursor: user.avatarUrl ? 'pointer' : 'default' }}
            onClick={() => user.avatarUrl && setShowLightbox(true)}
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => setShowFriendsModal('friends')}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{friendCount}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Amis</div>
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setShowFriendsModal('followers')}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{friendCount}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Abonnés</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalLikes}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>J'aime</div>
            </div>
          </div>

          {isSelf && (
            <button className="btn btn-secondary" onClick={() => setShowEditProfile(true)} style={{ width: '100%' }}>
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

        <div
          className="tabs"
          style={{ marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', justifyContent: 'space-around', padding: '0 4px' }}
        >
          {TABS.map((t) => (
            <div
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              title={t.title}
              style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
            >
              {t.icon}
            </div>
          ))}
        </div>

        {tab === 'posts' && (
          <>
            {isSelf && (
              <CreatePostBox
                onCreated={(post: PostItem) => {
                  setProfile((prev) => (prev ? { ...prev, posts: [post, ...prev.posts] } : prev));
                }}
              />
            )}
            {!canViewPosts && (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Ce contenu est réservé aux amis de {user.username}.
              </div>
            )}
            {canViewPosts && posts.length === 0 && (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                {isSelf ? "Vous n'avez encore rien publié." : 'Aucune publication pour l\'instant.'}
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

        {tab === 'products' && <CatalogTab userId={id} type="product" isSelf={isSelf} />}
        {tab === 'services' && <CatalogTab userId={id} type="service" isSelf={isSelf} />}
      </div>

      {showFriendsModal && (
        <FriendsListModal
          userId={id}
          title={showFriendsModal === 'friends' ? 'Amis' : 'Abonnés'}
          onClose={() => setShowFriendsModal(null)}
        />
      )}

      {showEditProfile && (
        <ProfileModal
          onClose={() => {
            setShowEditProfile(false);
            load();
          }}
        />
      )}

      {showLightbox && user.avatarUrl && (
        <div
          className="modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowLightbox(false)}
        >
          <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', top: 16, right: 16, color: '#fff' }} onClick={() => setShowLightbox(false)}>
            <X size={22} />
          </button>
          <img
            src={resolveFileUrl(user.avatarUrl)}
            alt=""
            style={{ maxWidth: '92%', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
