import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, LocalTrack } from 'livekit-client';
import api from '../services/api';
import { ArrowLeft, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';

export default function LiveRoom() {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as any) || {};

  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState<boolean>(!!navState.isHost);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const localCamTrackRef = useRef<LocalTrack | null>(null);

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
            localCamTrackRef.current = camPub.track as unknown as LocalTrack;
          }
        }

        setRoom(r);
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

  // Attache le flux caméra local UNE FOIS que l'élément <video> existe vraiment à l'écran
  // (il n'existe pas encore pendant que "connecting" est true).
  useEffect(() => {
    if (!connecting && isHost && localCamTrackRef.current && localVideoRef.current) {
      (localCamTrackRef.current as any).attach(localVideoRef.current);
    }
  }, [connecting, isHost]);

  const toggleMic = async () => {
    if (!room) return;
    const next = !micOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    if (!room) return;
    const next = !camOn;
    const pub = await room.localParticipant.setCameraEnabled(next);
    if (next && pub?.track && localVideoRef.current) {
      localCamTrackRef.current = pub.track as unknown as LocalTrack;
      (pub.track as any).attach(localVideoRef.current);
    }
    setCamOn(next);
  };

  const leave = async () => {
    room?.disconnect();
    if (isHost && postId) {
      try {
        await api.post(`/live/${postId}/end`);
      } catch {}
    }
    navigate('/feed');
  };

  return (
    <div style={{ height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {!connecting && !error && !isHost && (
        <div ref={remoteContainerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {viewerCount === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>En attente du diffuseur…</p>
          )}
        </div>
      )}

      {!connecting && !error && isHost && (
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button
            onClick={toggleMic}
            style={{ width: 52, height: 52, borderRadius: 999, border: 'none', background: micOn ? 'rgba(255,255,255,0.2)' : '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            onClick={leave}
            style={{ width: 60, height: 60, borderRadius: 999, border: 'none', background: '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PhoneOff size={26} />
          </button>
          <button
            onClick={toggleCam}
            style={{ width: 52, height: 52, borderRadius: 999, border: 'none', background: camOn ? 'rgba(255,255,255,0.2)' : '#ff3b30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {camOn ? <VideoIcon size={22} /> : <VideoOff size={22} />}
          </button>
        </div>
      )}

      {!connecting && !error && !isHost && (
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={leave}
            style={{ padding: '10px 24px', borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}
          >
            Quitter
          </button>
        </div>
      )}
    </div>
  );
      }
