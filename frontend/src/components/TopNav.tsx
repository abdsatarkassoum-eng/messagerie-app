import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Sun, Moon, LogOut, UserCog, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveFileUrl } from '../utils/url';
import { setupPushNotifications } from '../utils/pushNotifications';

export default function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupPushNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="topnav">
      <button className="topnav-logo" onClick={() => navigate('/feed')}>
        <div className="topnav-logo-mark">Fr</div>
        <span className="topnav-logo-text">FriEnds</span>
      </button>

      <div className="topnav-actions">
        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button
            className="topnav-icon-btn"
            onClick={() => setShowSettings((v) => !v)}
            title="Réglages"
          >
            <Settings size={18} />
          </button>

          {showSettings && (
            <div className="card dropdown-menu">
              <div className="dropdown-title">RÉGLAGES</div>
              <div
                className="dropdown-item"
                onClick={() => {
                  if (user) navigate(`/profile/${user.id}`);
                  setShowSettings(false);
                }}
              >
                <UserCog size={16} /> Mon profil
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  toggleTheme();
                  setShowSettings(false);
                }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                Mode {theme === 'dark' ? 'clair' : 'sombre'}
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate('/settings');
                  setShowSettings(false);
                }}
              >
                <SlidersHorizontal size={16} /> Réglages avancés
              </div>
              {user?.isAdmin && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/admin/invitations');
                    setShowSettings(false);
                  }}
                >
                  <ShieldCheck size={16} /> Administration
                </div>
              )}
              <div className="dropdown-item" style={{ color: 'var(--danger)' }} onClick={logout}>
                <LogOut size={16} /> Déconnexion
              </div>
            </div>
          )}
        </div>

        <div
          className="avatar"
          style={{ width: 34, height: 34, marginLeft: 4, cursor: 'pointer' }}
          onClick={() => user && navigate(`/profile/${user.id}`)}
        >
          {user?.avatarUrl ? (
            <img src={resolveFileUrl(user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
          ) : (
            user?.username[0]?.toUpperCase()
          )}
        </div>
      </div>
    </div>
  );
          }
