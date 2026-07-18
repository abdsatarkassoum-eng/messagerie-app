import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { X } from 'lucide-react';

interface Props {
  userId: string;
  title: string;
  onClose: () => void;
}

export default function FriendsListModal({ userId, title, onClose }: Props) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${userId}/friends-list`).then((res) => {
      setFriends(res.data.friends);
      setLoading(false);
    });
  }, [userId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
        {!loading && friends.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune personne à afficher.</p>}

        {friends.map((f) => (
          <div
            key={f.id}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer' }}
            onClick={() => {
              onClose();
              navigate(`/profile/${f.id}`);
            }}
          >
            <div
              className="avatar"
              style={{ width: 40, height: 40, background: f.avatarUrl ? undefined : avatarColorFor(f.username), color: '#fff' }}
            >
              {f.avatarUrl ? (
                <img src={resolveFileUrl(f.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
              ) : (
                f.username[0]?.toUpperCase()
              )}
            </div>
            <span style={{ fontWeight: 600 }}>{f.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
