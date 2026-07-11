import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveFileUrl } from '../utils/url';

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      if (password) formData.append('password', password);
      if (avatar) formData.append('avatar', avatar);

      const res = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="card modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
        <h2 style={{ marginTop: 0 }}>Mon profil</h2>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>
            {user?.avatarUrl ? (
              <img src={resolveFileUrl(user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              user?.username[0]?.toUpperCase()
            )}
          </div>
          <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
        </div>

        <label className="field-label">Nom d'utilisateur</label>
        <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginBottom: 14 }} />

        <label className="field-label">Bio</label>
        <textarea className="field" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ marginBottom: 14 }} />

        <label className="field-label">Nouveau mot de passe (optionnel)</label>
        <input type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" style={{ marginBottom: 18 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: '0.9rem' }}>Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
          <button type="button" className="btn btn-secondary" onClick={toggleTheme}>
            Passer en mode {theme === 'dark' ? 'clair' : 'sombre'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
        </div>

        <button type="button" className="btn btn-ghost" onClick={logout} style={{ marginTop: 12, color: 'var(--danger)', width: '100%' }}>
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
