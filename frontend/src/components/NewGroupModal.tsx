import React, { useState } from 'react';
import api from '../services/api';
import { UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';

interface Props {
  friends: UserProfile[];
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export default function NewGroupModal({ friends, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError('Sélectionnez au moins un ami.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name);
      selected.forEach((id) => formData.append('memberIds[]', id));
      if (avatar) formData.append('avatar', avatar);

      const res = await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(res.data.conversationId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du groupe.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="card modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Nouveau groupe</h2>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <label className="field-label">Nom du groupe</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} required style={{ marginBottom: 14 }} />

        <label className="field-label">Photo du groupe (optionnel)</label>
        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} style={{ marginBottom: 14 }} />

        <label className="field-label">Membres</label>
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 18 }}>
          {friends.length === 0 && (
            <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Ajoutez des amis pour pouvoir créer un groupe.
            </p>
          )}
          {friends.map((f) => (
            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} />
              <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.8rem' }}>
                {f.avatarUrl ? <img src={resolveFileUrl(f.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} /> : f.username[0]?.toUpperCase()}
              </div>
              <span>{f.username}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
            {creating ? 'Création…' : 'Créer le groupe'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
