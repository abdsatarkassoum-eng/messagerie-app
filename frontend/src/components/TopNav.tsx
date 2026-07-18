import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Sun, Moon, LogOut, UserCog, ShieldCheck, Check, X, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { FriendRequestItem } from '../types';
import { resolveFileUrl } from '../utils/url';

export default function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const socket = useSocket();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const loadRequests = async () => {
    try {
      const res = await api.get('/friends/requests');
      setRequests(res.data.received);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('friend_request:new', loadRequests);
    return () => {
      socket.off('friend_request:new', loadRequests);
    };
  }, [socket]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const respond = async (requestId: string, action: 'accept' | 'reject') => {
    await api.post('/friends/respond', { requestId, action });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <div className="topnav">
      <button className="topnav-logo" onClick={() => navigate('/feed')}>
        <div className="topnav-logo-mark">Fr</div>
        <span className="topnav-logo-text">FriEnds</span>
      </button>

      <div className="topnav-actions">
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="topnav-icon-btn"
            onClick={() => {
              setShowNotifs((v) => !v);
              setShowSettings(false);
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {requests.length > 0 && <span className="topnav-dot" />}
          </button>

          {showNotifs && (
            <div className="card dropdown-menu">
              <div className="dropdown-title">DEMANDES D'AMIS</div>
              {requests.length === 0 && (
                <p style={{ padding: '4px 14px 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Aucune nouvelle demande.
                </p>
              )}
              {requests.map((r) => (
                <div key={r.id} style={{ padding: '8px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div className="avatar" style={{ width: 30, height: 30 }}>
                      {r.sender.avatarUrl ? (
                        <img src={resolveFileUrl(r.sender.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                      ) : (
                        r.sender.username[0]?.toUpperCase()
                      )}
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{r.sender.username}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '5px' }} onClick={() => respond(r.id, 'accept')}>
                      <Check size={14} />
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '5px' }} onClick={() => respond(r.id, 'reject')}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button
            className="topnav-icon-btn"
            onClick={() => {
              setShowSettings((v) => !v);
              setShowNotifs(false);
            }}
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
