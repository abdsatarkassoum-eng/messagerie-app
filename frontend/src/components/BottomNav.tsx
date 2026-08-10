import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircle, CircleDashed, Users, Bell, Clapperboard } from 'lucide-react';

interface Props {
  active: 'home' | 'chats' | 'status' | 'friends' | 'requests' | 'videos';
  showVideo?: boolean;
}

export default function BottomNav({ active, showVideo }: Props) {
  const navigate = useNavigate();

  const goToChatTab = (tab: 'chats' | 'status' | 'friends' | 'requests') => {
    if (tab === 'chats') {
      navigate('/');
    } else {
      navigate('/', { state: { tab } });
    }
  };

  return (
    <div
      className="tabs"
      style={{
        justifyContent: 'space-around',
        padding: '8px 4px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
      }}
    >
      <div className={`tab ${active === 'home' ? 'active' : ''}`} onClick={() => navigate('/feed')} title="Accueil" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Home size={20} />
      </div>
      <div className={`tab ${active === 'chats' ? 'active' : ''}`} onClick={() => goToChatTab('chats')} title="Discussions" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <MessageCircle size={20} />
      </div>
      <div className={`tab ${active === 'status' ? 'active' : ''}`} onClick={() => goToChatTab('status')} title="Statuts" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <CircleDashed size={20} />
      </div>
      <div className={`tab ${active === 'friends' ? 'active' : ''}`} onClick={() => goToChatTab('friends')} title="Amis" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Users size={20} />
      </div>
      <div className={`tab ${active === 'requests' ? 'active' : ''}`} onClick={() => goToChatTab('requests')} title="Notifications" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Bell size={20} />
      </div>
      {showVideo && (
        <div className={`tab ${active === 'videos' ? 'active' : ''}`} onClick={() => navigate('/videos')} title="Vidéos" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Clapperboard size={20} />
        </div>
      )}
    </div>
  );
}
