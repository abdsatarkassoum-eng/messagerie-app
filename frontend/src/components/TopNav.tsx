import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../utils/url';
import { setupPushNotifications } from '../utils/pushNotifications';

export default function TopNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setupPushNotifications();
  }, []);

  return (
    <div className="topnav">
      <button className="topnav-logo" onClick={() => navigate('/feed')}>
        <div className="topnav-logo-mark">Fr</div>
        <span className="topnav-logo-text">FriEnds</span>
      </button>

      <div className="topnav-actions">
        <button
          className="topnav-icon-btn"
          onClick={() => navigate('/settings')}
          title="Explorer"
        >
          <LayoutGrid size={18} />
        </button>

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
