import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { StatusGroup } from '../types';
import { resolveFileUrl } from '../utils/url';
import CreateStatusModal from './CreateStatusModal';
import StatusViewer from './StatusViewer';

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function StatusList() {
  const socket = useSocket();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [own, setOwn] = useState<StatusGroup | null>(null);
  const [others, setOthers] = useState<StatusGroup[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewerStart, setViewerStart] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await api.get('/statuses');
      setOwn(res.data.own);
      setOthers(res.data.others);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('status:new', load);
    return () => {
      socket.off('status:new', load);
    };
  }, [socket]);

  // Liste complète, dans l'ordre d'affichage : mon statut d'abord, puis les autres
  const allGroups: StatusGroup[] = [...(own ? [own] : []), ...others];

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Mon statut */}
      <div
        className="conversation-item"
        onClick={() => {
          if (own) setViewerStart(0);
          else setShowCreate(true);
        }}
      >
        <div
          style={{ position: 'relative' }}
          onClick={(e) => {
            if (own) {
              e.stopPropagation();
              navigate(`/profile/${own.user.id}`);
            }
          }}
        >
          <div
            className="avatar"
            style={{
              width: 46,
              height: 46,
              border: own?.hasUnseen === false && own ? '2px solid var(--border)' : own ? '2px solid var(--accent)' : 'none',
            }}
          >
            {own?.user.avatarUrl ? (
              <img src={resolveFileUrl(own.user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              own?.user.username[0]?.toUpperCase() || '+'
            )}
          </div>
          {!own && (
            <div
              style={{
                position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 999,
                background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', border: '2px solid var(--bg-elevated)',
              }}
            >
              +
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Mon statut</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {own ? `${own.statuses.length} statut(s) · ${timeAgo(own.statuses[own.statuses.length - 1].createdAt)}` : 'Appuyez pour ajouter un statut'}
          </div>
        </div>
        {own && (
          <button
            className="btn btn-ghost btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowCreate(true);
            }}
            title="Ajouter"
          >
            ➕
          </button>
        )}
      </div>

      {others.length > 0 && (
        <div style={{ padding: '10px 16px 4px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          MISES À JOUR RÉCENTES
        </div>
      )}

      {others.map((g, idx) => (
        <div
          key={g.user.id}
          className="conversation-item"
          onClick={() => setViewerStart(own ? idx + 1 : idx)}
        >
          <div
            className="avatar"
            style={{ width: 46, height: 46, border: g.hasUnseen ? '2px solid var(--accent)' : '2px solid var(--border)' }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${g.user.id}`);
            }}
          >
            {g.user.avatarUrl ? (
              <img src={resolveFileUrl(g.user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              g.user.username[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{g.user.username}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {timeAgo(g.statuses[g.statuses.length - 1].createdAt)}
            </div>
          </div>
        </div>
      ))}

      {others.length === 0 && (
        <p style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Aucun statut de vos amis pour l'instant.
        </p>
      )}

      {showCreate && (
        <CreateStatusModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {viewerStart !== null && user && (
        <StatusViewer
          allGroups={allGroups}
          startGroupIndex={viewerStart}
          viewerId={user.id}
          onClose={() => {
            setViewerStart(null);
            load();
          }}
          onDeleted={load}
        />
      )}
    </div>
  );
}
