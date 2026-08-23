import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, LocalTrack, LocalVideoTrack } from 'livekit-client';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, RefreshCw, Heart, Send } from 'lucide-react';

interface LiveComment {
  id: string;
  content: string;
  username: string;
  avatarUrl: string | null;
}

interface FloatingHeart {
  id: number;
  left: number;
}

export default function LiveRoom() {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();
  const navState = (location.state as any) || {};

  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState<boolean>(!!navState.isHost);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const localCamTrackRef = useRef<LocalVideoTrack | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const heartIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        let token: string;
        let url: string;
        let host = !!navState.isHost;

        if (navState.token && navState.url) {
          token = navState.token;
          url = navState.url;
        } else {
          const res = await api.post(`/live/${postId}/join`);
          token = res.data.token;
          url = res.data.url;
          host = res.data.isHost;
        }

        if (cancelled) return;
        setIsHost(host);

        const r = new Room();
        roomRef.current = r;

        r.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.id = `track-${participant.identity}-${track.sid}`;
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.objectFit = 'cover';
            remoteContainerRef.current?.appendChild(el);
          }
        });

        r.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach().forEach((el) => el.remove());
        });

        r.on(RoomEvent.ParticipantConnected, () => setViewerCount((c) => c + 1));
        r.on(RoomEvent.ParticipantDisconnected, () => setViewerCount((c) => Math.max(0, c - 1)));

        await r.connect(url, token);
        setViewerCount(r.remoteParticipants.size);

        if (host) {
          await r.localParticipant.setMicrophoneEnabled(true);
          const camPub = await r.localParticipant.setCameraEnabled(true);
          if (camPub?.track) {
            localCamTrackRef.current = camPub.track as LocalVideoTrack;
          }
        }

        setConnecting(false);
      } catch (err: any) {
        console.error('[LIVE] Erreur de connexion :', err);
        if (!cancelled) {
          const detail = err?.message || err?.response?.data?.message || 'Erreur inconnue';
          setError(`Impossible de rejoindre le live. Détail : ${detail}`);
          setConnecting(false);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    if (!connecting && isHost && localCamTrackRef.current && localVideoRef.current) {
      localCamTrackRef.current.attach(localVideoRef.current);
    }
  }, [connecting, isHost]);

  // Chat + réactions en direct via Socket.io
  useEffect(() => {
    if (!socket || !postId) return;

    socket.emit('live:join', { postId });

    const onComment = (c: LiveComment) => {
      setComments((prev) => [...prev.slice(-49), c]);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    const onReaction = () => {
      const id = heartIdRef.current++;
      const left = 20 + Math.random() * 60;
      setHearts((prev) => [...prev, { id, left }]);
      setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2200);
    };

    socket.on('live:comment', onComment);
    socket.on('live:reaction', onReaction);

    return () => {
      socket.emit('live:leave', { postId });
      socket.off('live:comment', onComment);
      socket.off('live:reaction', onReaction);
    };
  }, [socket, postId]);

  const sendComment = () => {
    if (!commentText.trim() || !socket || !postId) return;
    socket.emit('live:comment', { postId, content: commentText.trim() });
    setCommentText('');
  };

  const sendReaction = () => {
    if (!socket || !postId) return;
    socket.emit('live:reaction', { postId });
    const id = heartIdRef.current++;
    const left = 20 + Math.random() * 60;
    setHearts((prev) => [...prev, { id, left }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2200);
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;
    const next = !micOn;
    await roomRef.current.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    if (!roomRef.current) return;
    const next = !camOn;
    const pub = await roomRef.current.localParticipant.setCameraEnabled(next);
    if (next && pub?.track && localVideoRef.current) {
      localCamTrackRef.current = pub.track as LocalVideoTrack;
      localCamTrackRef.current.attach(localVideoRef.current);
    }
    setCamOn(next);
  };

  const switchCamera = async () => {
    if (!localCamTrackRef.current) return;
    try {
      const currentFacing = (localCamTrackRef.current.mediaStreamTrack.getSettings().facingMode) || 'user';
      const nextFacing = currentFacing === 'environment' ? 'user' : 'environment';
      await localCamTrackRef.current.restartTrack({ facingMode: nextFacing });
    } catch (err) {
      console.error('[LIVE] Impossible de changer de caméra :', err);
    }
  };

  const leave = async () => {
    roomRef.current?.disconnect();
    if (isHost && postId) {
      try {
        await api.post(`/live/${postId}/end`);
      } catch {}
    }
    navigate('/feed');
  };

  return (
    <div style={{ height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost btn-icon" style={{ color: '#fff', background: 'rgba(0,0,0,0.4)' }} onClick={leave}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#ff3b30', color: '#fff', fontWeight: 800, fontSize: '0.74rem', padding: '4px 10px', borderRadius: 999 }}>
            🔴 EN DIRECT
          </span>
          <span style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.76rem', padding: '4px 10px', borderRadius: 999 }}>
            {viewerCount} spectateur{viewerCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {connecting && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          Connexion au live…
        </div>
      )}

      {error && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 30, textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/feed')}>Retour au fil</button>
        </div>
      )}

      {!connecting && !error && isHost && (
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      )}

      {!connecting && !error && !isHost && (
        <div ref={remoteContainerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {viewerCount === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>En attente du diffuseur…</p>
          )}
        </div>
      )}

      {/* Cœurs flottants */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25, overflow: 'hidden' }}>
        {hearts.map((h) => (
          <Heart
            key={h.id}
            size={28}
            fill="#ff3b6e"
            color="#ff3b6e"
            style={{
              position: 'absolute',
              bottom: 140,
              left: `${h.left}%`,
              animation: 'floatUp 2.2s ease-out forwards',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translateY(-30px) scale(1); }
          100% { transform: translateY(-320px) scale(1.1) translateX(10px); opacity: 0; }
        }
      `}</style>

      {/* Chat en direct, en bas à gauche */}
      {!connecting && !error && (
        <div
          style={{
            position: 'absolute', left: 12, right: 90, bottom: 84, zIndex: 20,
            maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
            maskImage: 'linear-gradient(to bottom, transparent, black 20%)',
          }}
        >
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span
                style={{
                  background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '0.8rem',
                  padding: '5px 10px', borderRadius: 14, maxWidth: '100%', wordBreak: 'break-word',
                }}
              >
                <strong style={{ color: '#ffb84d' }}>{c.username}</strong> {c.content}
              </span>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}

      {/* Réaction cœur, à droite */}
      {!connecting && !error && (
        <button
          onClick={sendReaction}
          style={{
            position: 'absolute', right: 14, bottom: 190, zIndex: 20,
            width: 46, height: 46, borderRadius: 999, border: 'none',
            background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Heart size={22} />
        </button>
      )}

      {/* Champ de saisie commentaire */}
      {!connecting && !error && (
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 20, zIndex: 20, display: 'flex', gap: 8 }}>
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            placeholder="Écrire un commentaire…"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 999,
              padding: '10px 16px', color: '#fff', fontSize: '0.86rem', outline: 'none',
            }}
          />
          <button
            onClick={sendComment}
            style={{
              width: 42, height: 42, borderRadius: 999, border: 'none',
              background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      )}

      {/* Contrôles hôte, remontés au-dessus du champ de saisie */}
      {!connecting && !error && isHost && (
        <div style={{ position: 'absolute', bottom: 76, right: 12, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 20 }}>
          <button
            onClick={toggleMic}
            style={{ width: 44, height: 44, borderRadius: 999, border: 'none', background: micOn ? 'rgba(255,255,255,0.2)' : '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            onClick={toggleCam}
            style={{ width: 44, height: 44, borderRadius: 999, border: 'none', background: camOn ? 'rgba(255,255,255,0.2)' : '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {camOn ? <VideoIcon size={18} /> : <VideoOff size={18} />}
          </button>
          <button
            onClick={switchCamera}
            style={{ width: 44, height: 44, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={leave}
            style={{ width: 50, height: 50, borderRadius: 999, border: 'none', background: '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PhoneOff size={22} />
          </button>
        </div>
      )}

      {!connecting && !error && !isHost && (
        <div style={{ position: 'absolute', bottom: 76, right: 12, zIndex: 20 }}>
          <button
            onClick={leave}
            style={{ width: 50, height: 50, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PhoneOff size={22} />
          </button>
        </div>
      )}
    </div>
  );
      }
