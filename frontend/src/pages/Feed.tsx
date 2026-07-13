import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TopNav from '../components/TopNav';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import { PostItem, UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { ArrowLeft } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [sentIds, setSentIds] = useState<string[]>([]);

  useEffect(() => {
    api.get('/posts').then((res) => {
      setPosts(res.data.posts);
      setLoading(false);
    });
    api.get('/users/suggestions/list').then((res) => setSuggestions(res.data.users));
  }, []);

  const addFriend = async (id: string) => {
    try {
      await api.post('/friends/request', { receiverId: id });
      setSentIds((prev) => [...prev, id]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    }
  };

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', height: 'calc(100vh - 58px)' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour aux discussions
        </button>

        {suggestions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 10 }}>Suggestions pour vous</h3>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {suggestions.map((u) => (
                <div key={u.id} className="card" style={{ padding: 12, textAlign: 'center', minWidth: 110, flexShrink: 0 }}>
                  <div
                    className="avatar"
                    style={{ width: 46, height: 46, margin: '0 auto 8px', background: u.avatarUrl ? undefined : avatarColorFor(u.username), color: '#fff' }}
                  >
                    {u.avatarUrl ? (
                      <img src={resolveFileUrl(u.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                    ) : (
                      u.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.username}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '5px', fontSize: '0.76rem' }}
                    onClick={() => addFriend(u.id)}
                    disabled={sentIds.includes(u.id)}
                  >
                    {sentIds.includes(u.id) ? '✓' : 'Ajouter'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <CreatePostBox onCreated={(post) => setPosts((prev) => [post, ...prev])} />

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chargement du fil…</p>}

        {!loading && posts.length === 0 && (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Aucune publication pour l'instant. Soyez le premier à partager quelque chose !
            </p>
          </div>
        )}

        {posts.map((p) => (
          <PostCard key={p.id} post={p} onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
        ))}
      </div>
    </div>
  );
}
