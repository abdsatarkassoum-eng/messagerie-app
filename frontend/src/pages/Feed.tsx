import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TopNav from '../components/TopNav';
import { UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [sentIds, setSentIds] = useState<string[]>([]);

  useEffect(() => {
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
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', overflowY: 'auto', height: 'calc(100vh - 58px)' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour aux discussions
        </button>

        <div
          className="card"
          style={{
            padding: 28,
            marginBottom: 24,
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--violet-soft), var(--pink-soft))',
            border: 'none',
          }}
        >
          <Sparkles size={30} color="var(--violet)" />
          <h2 style={{ margin: '10px 0 6px' }}>Le fil d'actualité arrive bientôt</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Bientôt, vous pourrez partager des publications, réagir et commenter directement ici.
            En attendant, découvrez des personnes à ajouter ci-dessous.
          </p>
        </div>

        <h3 style={{ marginBottom: 12 }}>Suggestions pour vous</h3>
        {suggestions.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune suggestion pour l'instant.</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {suggestions.map((u) => (
            <div key={u.id} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div className="avatar-ring" style={{ width: 60, height: 60, margin: '0 auto 10px' }}>
                <div
                  className="avatar"
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '1.2rem',
                    background: u.avatarUrl ? undefined : avatarColorFor(u.username),
                    color: u.avatarUrl ? undefined : '#fff',
                  }}
                >
                  {u.avatarUrl ? (
                    <img src={resolveFileUrl(u.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                  ) : (
                    u.username[0]?.toUpperCase()
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>{u.username}</div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '6px', fontSize: '0.82rem' }}
                onClick={() => addFriend(u.id)}
                disabled={sentIds.includes(u.id)}
              >
                {sentIds.includes(u.id) ? 'Envoyée ✓' : 'Ajouter'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
                                  }
