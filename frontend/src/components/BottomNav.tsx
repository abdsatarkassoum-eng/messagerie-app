import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircle, CircleDashed, Users, Bell, Clapperboard, Plus } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import CreatePostModal from './CreatePostModal';

type ChatTab = 'chats' | 'status' | 'friends' | 'requests';

interface Props {
  active: 'home' | ChatTab | 'videos';
  showVideo?: boolean;
  onNavigateTab?: (tab: ChatTab) => void;
}

export default function BottomNav({ active, showVideo, onNavigateTab }: Props) {
  const navigate = useNavigate();
  const { totalBadge } = useNotifications();
  const [showCreate, setShowCreate] = useState(false);

  const goToChatTab = (tab: ChatTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
      return;
    }
    if (tab === 'chats') {
      navigate('/');
    } else {
      navigate('/', { state: { tab } });
    }
  };

  const iconSize = showVideo ? 18 : 20;

  return (
    <>
      <div
        className="tabs"
        style={{
          justifyContent: 'space-around',
          padding: '8px 2px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          flexShrink: 0,
        }}
      >
        <div className={`tab ${active === 'home' ? 'active' : ''}`} onClick={() => navigate('/feed')} title="Accueil" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '12px 4px' }}>
          <Home size={iconSize} />
        </div>
        <div className={`tab ${active === 'chats' ? 'active' : ''}`} onClick={() => goToChatTab('chats')} title="Discussions" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '12px 4px' }}>
          <MessageCircle size={iconSize} />
        </div>
        <div className={`tab ${active === 'status' ? 'active' : ''}`} onClick={() => goToChatTab('status')} title="Statuts" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '12px 4px' }}>
          <CircleDashed size={iconSize} />
        </div>

        {/* Bouton central "Créer", en relief façon TikTok */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <button
            onClick={() => setShowCreate(true)}
            title="Créer"
            style={{
              position: 'absolute',
              top: -16,
              width: 42,
              height: 32,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #12a389, #f2914a)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px -4px rgba(18, 163, 137, 0.5)',
              cursor: 'pointer',
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className={`tab ${active === 'friends' ? 'active' : ''}`} onClick={() => goToChatTab('friends')} title="Amis" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '12px 4px' }}>
          <Users size={iconSize} />
        </div>
        <div className={`tab ${active === 'requests' ? 'active' : ''}`} onClick={() => goToChatTab('requests')} title="Notifications" style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', padding: '12px 4px' }}>
          <Bell size={iconSize} />
          {totalBadge > 0 && (
            <span className="badge" style={{ position: 'absolute', top: 4, right: '22%', minWidth: 15, height: 15, fontSize: '0.58rem' }}>
              {totalBadge > 9 ? '9+' : totalBadge}
            </span>
          )}
        </div>
        {showVideo && (
          <div className={`tab ${active === 'videos' ? 'active' : ''}`} onClick={() => navigate('/videos')} title="Vidéos" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '12px 4px' }}>
            <Clapperboard size={iconSize} />
          </div>
        )}
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
          }
