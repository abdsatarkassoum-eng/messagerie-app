import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { StatusGroup, UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';

interface Props {
  group: StatusGroup;
  isOwn: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function StatusViewer({ group, isOwn, onClose, onDeleted }: Props) {
  const [index, setIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<(UserProfile & { viewedAt: string })[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = group.statuses[index];
  const DURATION = current?.type === 'video' ? 15000 : 5000;

  useEffect(() => {
    if (!current) return;
    if (!isOwn) {
      api.post(`/statuses/${current.id}/view`).catch(() => {});
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function next() {
    if (index < group.statuses.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }

  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  async function loadViewers() {
    try {
      const res = await api.get(`/statuses/${current.id}/viewers`);
      setViewers(res.data.viewers);
      setShowViewers(true);
    } catch {
      /* silencieux */
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce statut ?')) return;
    try {
      await api.delete(`/statuses/${current.id}`);
      onDeleted?.();
      onClose();
    } catch {
      /* silencieux */
    }
  }

  if (!current) return null;

  return (
    <div className="call-overlay" style={{ padding: 0 }}>
      <div style={{ width: '100%', maxWidth: 480, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Barres de progression */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 12px 0' }}>
          {group.statuses.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: '#fff',
                  width: i < index ? '100%' : i === index ? '100%' : '0%',
                  transition: i === index ? `width ${DURATION}ms linear` : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div className="avatar" style={{ width: 36, height: 36 }}>
            {group.user.avatarUrl ? (
              <img src={resolveFileUrl(group.user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              group.user.username[0]?.toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, color: '#fff' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{isOwn ? 'Mon statut' : group.user.username}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {new Date(current.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          {isOwn && (
            <button className="btn btn-ghost btn-icon" style={{ color: '#fff' }} onClick={handleDelete} title="Supprimer">🗑️</button>
          )}
          <button className="btn btn-ghost btn-icon" style={{ color: '#fff' }} onClick={onClose}>✖</button>
        </div>

        {/* Contenu */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onClick={(e) => {
            const x = e.clientX;
            const width = (e.currentTarget as HTMLDivElement).clientWidth;
            if (x < width / 3) prev();
            else next();
          }}
        >
          {current.type === 'text' && (
            <div
              style={{
                background: current.backgroundColor || '#1f7a6c',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 30,
                textAlign: 'center',
                color: '#fff',
                fontSize: '1.4rem',
                fontWeight: 600,
              }}
            >
              {current.content}
            </div>
          )}
          {current.type === 'image' && current.fileUrl && (
            <img src={resolveFileUrl(current.fileUrl)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
          {current.type === 'video' && current.fileUrl && (
            <video src={resolveFileUrl(current.fileUrl)} autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
          )}
        </div>

        {current.content && current.type !== 'text' && (
          <div style={{ color: '#fff', padding: '10px 16px', textAlign: 'center' }}>{current.content}</div>
        )}

        {isOwn && (
          <button
            className="btn btn-ghost"
            style={{ color: '#fff', margin: '0 16px 16px' }}
            onClick={loadViewers}
          >
            👁️ Voir qui a consulté
          </button>
        )}
      </div>

      {showViewers && (
        <div className="modal-backdrop" onClick={() => setShowViewers(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Vu par</h3>
            {viewers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Personne n'a encore vu ce statut.</p>}
            {viewers.map((v) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <div className="avatar" style={{ width: 32, height: 32 }}>
                  {v.avatarUrl ? <img src={resolveFileUrl(v.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} /> : v.username[0]?.toUpperCase()}
                </div>
                <span>{v.username}</span>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => setShowViewers(false)} style={{ marginTop: 14, width: '100%' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
        }
