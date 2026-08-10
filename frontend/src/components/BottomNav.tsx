import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircle, CircleDashed, Users, Bell, Clapperboard } from 'lucide-react';

type ChatTab = 'chats' | 'status' | 'friends' | 'requests';

interface Props {
  active: 'home' | ChatTab | 'videos';
  showVideo?: boolean;
  // Si fourni, les onglets Discussions/Statuts/Amis/Notifications changent le
  // contenu sur place (utilisé sur la page Discussions elle-même) au lieu de
  // naviguer vers une autre page.
  onNavigateTab?: (tab: ChatTab) => void;
}

export default function BottomNav({ active, showVideo, onNavigateTab }: Props) {
  const navigate = useNavigate();

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
