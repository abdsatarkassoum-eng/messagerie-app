import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, HelpCircle, ShieldCheck, FileText, Info, ChevronRight, LogOut, Gamepad2, Sparkles, Sun, Moon, Image as ImageIcon, Lock, Download } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TopNav from '../components/TopNav';
import { WALLPAPERS } from '../utils/wallpapers';

const DARK = {
  bg: '#0a0c10',
  surface: '#15181f',
  surfaceRaised: '#1b1f28',
  border: '#262b35',
  text: '#f5f6f8',
  textMuted: '#8b93a1',
  accentGradient: 'linear-gradient(90deg, #ff5f8f 0%, #ff9d5c 50%, #7c3aed 100%)',
};

const HUB_TILES = [
  { id: 'gaming', label: 'GamingHub', icon: <Gamepad2 size={30} />, gradient: 'linear-gradient(135deg, #1f7a6c 0%, #0d3b33 100%)' },
  { id: 'divertissement', label: 'Divertissement', icon: <Sparkles size={30} />, gradient: 'linear-gradient(135deg, #ff5f8f 0%, #7c3aed 100%)' },
];

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: DARK.surfaceRaised, border: `1px solid ${DARK.border}`, borderRadius: 18, padding: 20, marginBottom: 18 }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: DARK.accentGradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
      }}>
        {icon}
      </div>
      <h3 style={{ margin: 0, color: DARK.text, fontSize: '1rem', fontWeight: 800 }}>{children}</h3>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
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

  const INFO_LINKS = [
    { page: 'help', icon: <HelpCircle size={18} />, label: "Centre d'aide" },
    { page: 'privacy', icon: <ShieldCheck size={18} />, label: 'Politique de confidentialité' },
    { page: 'terms', icon: <FileText size={18} />, label: "Conditions générales d'utilisation" },
    { page: 'about', icon: <Info size={18} />, label: 'À propos' },
  ];

  return (
    <div className="app-root">
      <TopNav />
      <div
        style={{
          background: DARK.bg,
          minHeight: 'calc(100dvh - 58px)',
          height: 'calc(100dvh - 58px)',
          overflowY: 'auto',
          padding: '20px 16px 40px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              color: DARK.textMuted, fontSize: '0.9rem', fontWeight: 600, padding: '8px 0', marginBottom: 16, cursor: 'pointer',
            }}
          >
            ← Retour aux discussions
          </button>

          {/* Hubs — bannières pleine largeur */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {HUB_TILES.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate('/explore', { state: { hubSlug: h.id } })}
                style={{
                  flex: 1,
                  minHeight: 120,
                  borderRadius: 20,
                  padding: 18,
                  cursor: 'pointer',
                  background: h.gradient,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12, background: 'rgba(0,0,0,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  {h.icon}
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{h.label}</div>
              </div>
            ))}
          </div>

          <h2 style={{ color: DARK.text, margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800 }}>Réglages</h2>
          <p style={{ color: DARK.textMuted, margin: '0 0 22px', fontSize: '0.88rem' }}>
            Personnalisez votre expérience FriEnds.
            {saved && (
              <span style={{ color: '#4ade80', marginLeft: 10, fontWeight: 700 }}>
                <Check size={14} style={{ verticalAlign: 'middle' }} /> Enregistré
              </span>
            )}
          </p>

          {/* Apparence */}
          <SectionCard>
            <SectionTitle icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}>Apparence</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: DARK.text, fontSize: '0.9rem' }}>Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
              <button
                onClick={toggleTheme}
                style={{
                  border: `1px solid ${DARK.border}`, background: DARK.surface, color: DARK.text,
                  borderRadius: 999, padding: '9px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Passer en mode {theme === 'dark' ? 'clair' : 'sombre'}
              </button>
            </div>
          </SectionCard>

          {/* Fond d'écran */}
          <SectionCard>
            <SectionTitle icon={<ImageIcon size={18} />}>Fond d'écran des discussions</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
              {WALLPAPERS.map((w) => (
                <div key={w.id} onClick={() => selectWallpaper(w.id)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div
                    style={{
                      height: 70,
                      borderRadius: 12,
                      background: w.isPattern ? DARK.surface : w.preview,
                      backgroundImage: w.isPattern ? w.preview : undefined,
                      backgroundSize: w.isPattern ? '14px 14px' : undefined,
                      border: wallpaper === w.id ? '2px solid transparent' : `1px solid ${DARK.border}`,
                      backgroundOrigin: 'border-box',
                      boxShadow: wallpaper === w.id ? '0 0 0 2px #ff5f8f' : undefined,
                      marginBottom: 6,
                      position: 'relative',
                    }}
                  >
                    {wallpaper === w.id && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6, background: DARK.accentGradient, borderRadius: 999,
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.76rem', color: DARK.textMuted }}>{w.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Confidentialité */}
          <SectionCard>
            <SectionTitle icon={<Lock size={18} />}>Confidentialité</SectionTitle>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: DARK.textMuted, fontSize: '0.8rem', marginBottom: 8 }}>
                Qui peut voir ma photo de profil
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => changeVisibility('everyone')}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    background: profileVisibility === 'everyone' ? DARK.accentGradient : DARK.surface,
                    color: profileVisibility === 'everyone' ? '#fff' : DARK.text,
                    boxShadow: profileVisibility === 'everyone' ? 'none' : `inset 0 0 0 1px ${DARK.border}`,
                  }}
                >
                  Tout le monde
                </button>
                <button
                  onClick={() => changeVisibility('friends')}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    background: profileVisibility === 'friends' ? DARK.accentGradient : DARK.surface,
                    color: profileVisibility === 'friends' ? '#fff' : DARK.text,
                    boxShadow: profileVisibility === 'friends' ? 'none' : `inset 0 0 0 1px ${DARK.border}`,
                  }}
                >
                  Amis uniquement
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Download size={16} color={DARK.textMuted} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: DARK.text }}>Téléchargement auto des médias</div>
                  <div style={{ fontSize: '0.76rem', color: DARK.textMuted }}>
                    Si désactivé, appuyez sur un média pour l'afficher.
                  </div>
                </div>
              </div>
              <button
                onClick={toggleMediaAutoDownload}
                disabled={saving}
                style={{
                  flexShrink: 0, border: 'none', borderRadius: 999, padding: '8px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  background: mediaAutoDownload ? DARK.accentGradient : DARK.surface,
                  color: mediaAutoDownload ? '#fff' : DARK.textMuted,
                  boxShadow: mediaAutoDownload ? 'none' : `inset 0 0 0 1px ${DARK.border}`,
                }}
              >
                {mediaAutoDownload ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </SectionCard>

          {/* Aide et informations */}
          <SectionCard>
            {INFO_LINKS.map((link, i) => (
              <div
                key={link.page}
                onClick={() => navigate(`/info/${link.page}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px',
                  cursor: 'pointer', borderBottom: i < INFO_LINKS.length - 1 ? `1px solid ${DARK.border}` : 'none',
                }}
              >
                <span style={{ color: '#ff5f8f' }}>{link.icon}</span>
                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: DARK.text }}>{link.label}</span>
                <ChevronRight size={16} color={DARK.textMuted} />
              </div>
            ))}
          </SectionCard>

          {/* Compte */}
          <SectionCard>
            {user?.isAdmin && (
              <div
                onClick={() => navigate('/admin/invitations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px',
                  cursor: 'pointer', borderBottom: `1px solid ${DARK.border}`,
                }}
              >
                <span style={{ color: '#ff5f8f' }}><ShieldCheck size={18} /></span>
                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: DARK.text }}>Administration</span>
                <ChevronRight size={16} color={DARK.textMuted} />
              </div>
            )}
            <div
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', cursor: 'pointer', color: '#ff6b6b' }}
            >
              <LogOut size={18} />
              <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>Déconnexion</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
        }
