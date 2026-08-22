import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PostItem, PostComment } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { Heart, MessageCircle, Trash2, Send, BadgeCheck, Radio } from 'lucide-react';

interface Props {
  post: PostItem;
  onDeleted: (id: string) => void;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function isCurrentlyVerified(isVerified?: boolean, verifiedUntil?: string | null) {
  return !!isVerified && !!verifiedUntil && new Date(verifiedUntil) > new Date();
}

const mediaStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  height: 420,
  maxHeight: 420,
  display: 'block',
  objectFit: 'cover',
  borderRadius: 12,
  marginBottom: 8,
  boxSizing: 'border-box',
};

export default function PostCard({ post, onDeleted }: Props) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  const verified = isCurrentlyVerified((post.author as any).isVerified, (post.author as any).verifiedUntil);
  const isLive = post.type === 'live' && (post as any).isLive;

  const toggleLike = async () => {
    setLiked((v) => !v);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      setLiked((v) => !v);
      setLikesCount((c) => (liked ? c + 1 : c - 1));
    }
  };

  const toggleComments = async () => {
    setShowComments((v) => !v);
    if (!commentsLoaded) {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data.comments);
      setCommentsLoaded(true);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const res = await api.post(`/posts/${post.id}/comments`, { content: commentText.trim() });
    setComments((prev) => [...prev, res.data.comment]);
    setCommentsCount((c) => c + 1);
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette publication ?')) return;
    await api.delete(`/posts/${post.id}`);
    onDeleted(post.id);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        background: 'var(--bg-elevated)',
        border: isLive ? '1px solid #ff3b30' : '1px solid var(--border)',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          className="avatar"
          style={{ width: 38, height: 38, background: post.author.avatarUrl ? undefined : avatarColorFor(post.author.username), color: '#fff', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate(`/profile/${post.author.id}`)}
        >
          {post.author.avatarUrl ? (
            <img src={resolveFileUrl(post.author.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
          ) : (
            post.author.username[0]?.toUpperCase()
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => navigate(`/profile/${post.author.id}`)}
          >
            {post.author.username}
            {verified && <BadgeCheck size={16} color="#fff" fill="#3b9eff" />}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
        </div>
        {post.isMine && !isLive && (
          <button className="btn btn-ghost btn-icon" onClick={handleDelete} title="Supprimer">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {post.content && <p style={{ margin: '0 0 10px', fontSize: '0.95rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</p>}

      {post.type === 'image' && post.fileUrl && (
        <img src={resolveFileUrl(post.fileUrl)} alt="" style={mediaStyle} />
      )}
      {post.type === 'video' && post.fileUrl && (
        <video src={resolveFileUrl(post.fileUrl)} controls style={mediaStyle} />
      )}

      {post.type === 'live' && (
        <div
          onClick={() => isLive && navigate(`/live/${post.id}`)}
          style={{
            ...mediaStyle,
            height: 180,
            background: 'linear-gradient(135deg, #1a0000, #3a0a0a)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: isLive ? 'pointer' : 'default',
          }}
        >
          {isLive ? (
            <>
              <span style={{ background: '#ff3b30', color: '#fff', fontWeight: 800, fontSize: '0.76rem', padding: '5px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Radio size={14} /> EN DIRECT
              </span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Rejoindre le live</span>
            </>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.86rem' }}>Live terminé</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggleLike}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: liked ? 'var(--pink)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.86rem' }}
        >
          <Heart size={18} fill={liked ? 'var(--pink)' : 'none'} style={{ transition: 'transform 0.15s' }} />
          {likesCount > 0 ? likesCount : ''} J'aime
        </button>
        <button
          onClick={toggleComments}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.86rem' }}
        >
          <MessageCircle size={18} />
          {commentsCount > 0 ? commentsCount : ''} Commenter
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div
                className="avatar"
                style={{ width: 28, height: 28, fontSize: '0.7rem', background: c.author.avatarUrl ? undefined : avatarColorFor(c.author.username), color: '#fff', flexShrink: 0 }}
              >
                {c.author.avatarUrl ? (
                  <img src={resolveFileUrl(c.author.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                ) : (
                  c.author.username[0]?.toUpperCase()
                )}
              </div>
              <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, padding: '6px 12px', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.author.username}</div>
                <div style={{ fontSize: '0.86rem', wordBreak: 'break-word' }}>{c.content}</div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              className="field"
              placeholder="Écrire un commentaire…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              style={{ padding: '8px 12px', fontSize: '0.86rem', minWidth: 0 }}
            />
            <button className="btn btn-primary btn-icon" onClick={submitComment}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
                  }
