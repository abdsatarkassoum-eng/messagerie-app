import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PostItem, PostComment } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { Heart, MessageCircle, X, Send, ArrowLeft } from 'lucide-react';

export default function VideoFeed() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts').then((res) => {
      setVideos(res.data.posts.filter((p: PostItem) => p.type === 'video'));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ height: '100vh', background: '#000', position: 'relative' }}>
      <button
        className="btn btn-ghost btn-icon"
        style={{ position: 'fixed', top: 14, left: 14, zIndex: 20, color: '#fff', background: 'rgba(0,0,0,0.4)' }}
        onClick={() => navigate('/feed')}
      >
        <ArrowLeft size={20} />
      </button>

      {loading && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          Chargement des vidéos…
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 30, textAlign: 'center' }}>
          <p>Aucune vidéo pour l'instant.</p>
          <button className="btn btn-primary" onClick={() => navigate('/feed')}>Retour au fil</button>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div
          style={{
            height: '100%',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
          }}
        >
          {videos.map((v) => (
            <VideoSlide key={v.id} post={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoSlide({ post }: { post: PostItem }) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    setCommentText('');
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      <video
        ref={videoRef}
        src={resolveFileUrl(post.fileUrl)}
        loop
        muted
        playsInline
        style={{ maxHeight: '100%', maxWidth: '100%' }}
        onClick={(e) => {
          const v = e.currentTarget;
          v.paused ? v.play() : v.pause();
        }}
      />

      {/* Infos auteur + légende, en bas à gauche */}
      <div style={{ position: 'absolute', left: 16, bottom: 90, right: 80, color: '#fff' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.author.id}`)}
        >
          <div
            className="avatar"
            style={{ width: 34, height: 34, background: post.author.avatarUrl ? undefined : avatarColorFor(post.author.username), color: '#fff' }}
          >
            {post.author.avatarUrl ? (
              <img src={resolveFileUrl(post.author.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              post.author.username[0]?.toUpperCase()
            )}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{post.author.username}</span>
        </div>
        {post.content && <p style={{ margin: 0, fontSize: '0.86rem' }}>{post.content}</p>}
      </div>

      {/* Boutons d'action, à droite */}
      <div style={{ position: 'absolute', right: 12, bottom: 100, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center' }}>
        <button onClick={toggleLike} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Heart size={30} fill={liked ? 'var(--pink)' : 'none'} color={liked ? 'var(--pink)' : '#fff'} />
          <span style={{ fontSize: '0.74rem' }}>{likesCount > 0 ? likesCount : ''}</span>
        </button>
        <button onClick={toggleComments} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <MessageCircle size={28} />
          <span style={{ fontSize: '0.74rem' }}>{post.commentsCount > 0 ? post.commentsCount : ''}</span>
        </button>
      </div>

      {showComments && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '55%',
            background: 'var(--bg-elevated)', borderTopLeftRadius: 18, borderTopRightRadius: 18,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10,
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
  );
}
