import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { StatusGroup, UserProfile, PostComment as StatusCommentType } from '../types';
import { resolveFileUrl } from '../utils/url';
import { Heart, MessageCircle, Send, X, Trash2 } from 'lucide-react';

interface Props {
  allGroups: StatusGroup[];
  startGroupIndex: number;
  viewerId: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function StatusViewer({ allGroups, startGroupIndex, viewerId, onClose, onDeleted }: Props) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [statusIndex, setStatusIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<(UserProfile & { viewedAt: string })[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<StatusCommentType[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const group = allGroups[groupIndex];
  const current = group?.statuses[statusIndex];
  const isOwn = group?.user.id === viewerId;
  const DURATION = current?.type === 'video' ? 15000 : 5000;

  useEffect(() => {
    if (!current) return;
    setLiked(current.likedByMe);
    setLikesCount(current.likesCount);
    setCommentsLoaded(false);
    setComments([]);

    if (!isOwn) {
      api.post(`/statuses/${current.id}/view`).catch(() => {});
    }

    if (!showComments) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(next, DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, statusIndex, showComments]);

  function next() {
    if (!group) return;
    if (statusIndex < group.statuses.length - 1) {
      setStatusIndex((i) => i + 1);
    } else if (groupIndex < allGroups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStatusIndex(0);
    } else {
      onClose();
    }
  }

  function prev() {
    if (statusIndex > 0) {
      setStatusIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = allGroups[groupIndex - 1];
      setGroupIndex((g) => g - 1);
      setStatusIndex(prevGroup.statuses.length - 1);
    }
  }

  async function toggleLike() {
    if (!current) return;
    setLiked((v) => !v);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    try {
      await api.post(`/statuses/${current.id}/like`);
    } catch {
      setLiked((v) => !v);
      setLikesCount((c) => (liked ? c + 1 : c - 1));
    }
  }

  async function toggleComments() {
    setShowComments((v) => !v);
    if (!commentsLoaded && current) {
      const res = await api.get(`/statuses/${current.id}/comments`);
      setComments(res.data.comments);
      setCommentsLoaded(true);
    }
  }

  async function submitComment() {
    if (!commentText.trim() || !current) return;
    const res = await api.post(`/statuses/${current.id}/comments`, { content: commentText.trim() });
    setComments((prev) => [...prev, res.data.comment]);
    setCommentText('');
  }

  async function loadViewers() {
    if (!current) return;
    try {
      const res = await api.get(`/statuses/${current.id}/viewers`);
      setViewers(res.data.viewers);
      setShowViewers(true);
    } catch {
      /* silencieux */
    }
  }

  async function handleDelete() {
    if (!current || !confirm('Supprimer ce statut ?')) return;
    try {
      await api.delete(`/statuses/${current.id}`);
      onDeleted?.();
      onClose();
    } catch {
      /* silencieux */
    }
  }

  if (!group || !current) return null;

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
                  width: i < statusIndex ? '100%' : i === statusIndex ? '100%' : '0%',
                  transition: i === statusIndex && !showComments ? `width ${DURATION}ms linear` : 'none',
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
            <button className="btn btn-ghost btn-icon" style={{ color: '#fff' }} onClick={handleDelete} title="Supprimer">
              <Trash2 size={18} />
            </button>
          )}
          <button className="btn btn-ghost btn-icon" style={{ color: '#fff' }} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Contenu */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onClick={(e) => {
            if (showComments) return;
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

          {/* Barre d'actions façon TikTok, à droite */}
          <div style={{ position: 'absolute', right: 10, bottom: 90, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            >
              <Heart size={28} fill={liked ? 'var(--pink)' : 'none'} color={liked ? 'var(--pink)' : '#fff'} />
              <span style={{ fontSize: '0.72rem' }}>{likesCount > 0 ? likesCount : ''}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleComments();
              }}
              style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            >
              <MessageCircle size={26} />
              <span style={{ fontSize: '0.72rem' }}>{comments.length > 0 ? comments.length : ''}</span>
            </button>
          </div>
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

        {/* Panneau de commentaires (façon TikTok, en bas) */}
        {showComments && (
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '55%',
              background: 'var(--bg-elevated)', borderTopLeftRadius: 18, borderTopRightRadius: 18,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.9rem' }}>Commentaires</strong>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowComments(false)}><X size={18} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 16px', flex: 1 }}>
              {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun commentaire pour l'instant.</p>}
              {comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                    {c.author.avatarUrl ? (
                      <img src={resolveFileUrl(c.author.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                    ) : (
                      c.author.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, padding: '6px 12px', flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.author.username}</div>
                    <div style={{ fontSize: '0.85rem' }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}>
              <input
                className="field"
                placeholder="Ajouter un commentaire…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              />
              <button className="btn btn-primary btn-icon" onClick={submitComment}>
                <Send size={16} />
              </button>
            </div>
          </div>
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
