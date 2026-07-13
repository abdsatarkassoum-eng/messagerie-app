import React, { useState } from 'react';
import api from '../services/api';
import { PostItem, PostComment } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';

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

export default function PostCard({ post, onDeleted }: Props) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

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
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          className="avatar"
          style={{ width: 38, height: 38, background: post.author.avatarUrl ? undefined : avatarColorFor(post.author.username), color: '#fff' }}
        >
          {post.author.avatarUrl ? (
            <img src={resolveFileUrl(post.author.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
          ) : (
            post.author.username[0]?.toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{post.author.username}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
        </div>
        {post.isMine && (
          <button className="btn btn-ghost btn-icon" onClick={handleDelete} title="Supprimer">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {post.content && <p style={{ margin: '0 0 10px', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{post.content}</p>}

      {post.type === 'image' && post.fileUrl && (
        <img src={resolveFileUrl(post.fileUrl)} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 8 }} />
      )}
      {post.type === 'video' && post.fileUrl && (
        <video src={resolveFileUrl(post.fileUrl)} controls style={{ width: '100%', borderRadius: 12, marginBottom: 8 }} />
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
                style={{ width: 28, height: 28, fontSize: '0.7rem', background: c.author.avatarUrl ? undefined : avatarColorFor(c.author.username), color: '#fff' }}
              >
                {c.author.avatarUrl ? (
                  <img src={resolveFileUrl(c.author.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                ) : (
                  c.author.username[0]?.toUpperCase()
                )}
              </div>
              <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, padding: '6px 12px', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.author.username}</div>
                <div style={{ fontSize: '0.86rem' }}>{c.content}</div>
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
              style={{ padding: '8px 12px', fontSize: '0.86rem' }}
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
