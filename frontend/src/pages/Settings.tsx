import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TopNav from '../components/TopNav';
import { WALLPAPERS } from '../utils/wallpapers';

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [wallpaper, setWallpaper] = useState(user?.wallpaper || 'default');
  const [profileVisibility, setProfileVisibility] = useState(user?.profileVisibility || 'everyone');
  const [mediaAutoDownload, setMediaAutoDownload] = useState(user?.mediaAutoDownload !== false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (overrides: Partial<{ wallpaper: string; profileVisibility: string; mediaAutoDownload: boolean }> = {}) => {
    setSaving(true);
    setSaved(false);
    try {
      const formData = new FormData();
      formData.append('wallpaper', overrides.wallpaper ?? wallpaper);
      formData.append('profileVisibility', overrides.profileVisibility ?? profileVisibility);
      formData.append('mediaAutoDownload', String(overrides.mediaAutoDownload ?? mediaAutoDownload));

      const res = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const selectWallpaper = (id: string) => {
    setWallpaper(id);
    save({ wallpaper: id });
  };

  const changeVisibility = (value: 'everyone' | 'friends') => {
    setProfileVisibility(value);
    save({ profileVisibility: value });
  };

  const toggleMediaAutoDownload = () => {
    const next = !mediaAutoDownload;
    setMediaAutoDownload(next);
    save({ mediaAutoDownload: next });
  };

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', height: 'calc(100vh - 58px)' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour aux discussions
        </button>

        <h2 style={{ marginBottom: 4 }}>Réglages</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 24 }}>
          Personnalisez votre expérience FriEnds.
          {saved && <span style={{ color: 'var(--accent)', marginLeft: 10, fontWeight: 600 }}><Check size={14} style={{ verticalAlign: 'middle' }} /> Enregistré</span>}
        </p>

        {/* Apparence */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Apparence</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.9rem' }}>Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
            <button className="btn btn-secondary" onClick={toggleTheme}>
              Passer en mode {theme === 'dark' ? 'clair' : 'sombre'}
            </button>
          </div>
        </div>

        {/* Fond d'écran de discussion */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Fond d'écran des discussions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
            {WALLPAPERS.map((w) => (
              <div key={w.id} onClick={() => selectWallpaper(w.id)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div
                  style={{
                    height: 70,
                    borderRadius: 12,
                    background: w.isPattern ? 'var(--bg)' : w.preview,
                    backgroundImage: w.isPattern ? w.preview : undefined,
                    backgroundSize: w.isPattern ? '14px 14px' : undefined,
                    border: wallpaper === w.id ? '3px solid var(--accent)' : '1px solid var(--border)',
                    marginBottom: 6,
                    position: 'relative',
                  }}
                >
                  {wallpaper === w.id && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--accent)', borderRadius: 999, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="#fff" />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidentialité */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Confidentialité</h3>

          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Qui peut voir ma photo de profil</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={profileVisibility === 'everyone' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ flex: 1 }}
                onClick={() => changeVisibility('everyone')}
              >
                Tout le monde
              </button>
              <button
                className={profileVisibility === 'friends' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ flex: 1 }}
                onClick={() => changeVisibility('friends')}
              >
                Amis uniquement
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Téléchargement automatique des médias</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Si désactivé, appuyez sur une image/vidéo reçue pour l'afficher.
              </div>
            </div>
            <button className="btn btn-secondary" onClick={toggleMediaAutoDownload} disabled={saving}>
              {mediaAutoDownload ? 'Activé' : 'Désactivé'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
