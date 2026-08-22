import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
} from 'livekit-client';
import api from '../services/api';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
} from 'lucide-react';

export default function LiveRoom() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        if (!postId) {
          throw new Error('Identifiant du live manquant');
        }

        /*
         * IMPORTANT :
         * On demande toujours un nouveau token au backend.
         * On ne réutilise pas un token éventuellement présent
         * dans location.state, car celui-ci peut être expiré
         * ou invalide.
         */
        console.log('[LIVE] Demande d’un nouveau token...');
        console.log('[LIVE] Post ID:', postId);

        const res = await api.post(`/live/${postId}/join`);

        const token = res.data?.token;
        const url = res.data?.url;
        const host = !!res.data?.isHost;

        console.log('[LIVE] Réponse du serveur reçue');
        console.log('[LIVE] URL LiveKit:', url);
        console.log('[LIVE] Token reçu:', !!token);
        console.log('[LIVE] Utilisateur hôte:', host);

        if (!token) {
          throw new Error(
            'Le serveur n’a fourni aucun token LiveKit.'
          );
        }

        if (!url) {
          throw new Error(
            'Le serveur n’a fourni aucune URL LiveKit.'
          );
        }

        if (cancelled) {
          return;
        }

        setIsHost(host);

        const r = new Room();

        roomRef.current = r;

        /*
         * Réception des pistes vidéo/audio des autres participants.
         */
        r.on(
          RoomEvent.TrackSubscribed,
          (
            track: RemoteTrack,
            _publication,
            participant: RemoteParticipant
          ) => {
            console.log(
              '[LIVE] Piste reçue de:',
              participant.identity,
              track.kind
            );

            if (
              track.kind === Track.Kind.Video ||
              track.kind === Track.Kind.Audio
            ) {
              const el = track.attach();

              el.id = `track-${participant.identity}-${track.sid}`;

              el.style.width = '100%';
              el.style.height = '100%';
              el.style.objectFit = 'cover';

              remoteContainerRef.current?.appendChild(el);
            }
          }
        );

        /*
         * Lorsqu'une piste distante est supprimée.
         */
        r.on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack) => {
            track.detach().forEach((el) => el.remove());
          }
        );

        /*
         * Nouveau participant.
         */
        r.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log(
            '[LIVE] Participant connecté:',
            participant.identity
          );

          setViewerCount((count) => count + 1);
        });

        /*
         * Participant parti.
         */
        r.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log(
            '[LIVE] Participant déconnecté:',
            participant.identity
          );

          setViewerCount((count) => Math.max(0, count - 1));
        });

        /*
         * Déconnexion de LiveKit.
         */
        r.on(RoomEvent.Disconnected, (reason) => {
          console.log(
            '[LIVE] Déconnecté de LiveKit. Raison:',
            reason
          );
        });

        /*
         * Connexion à LiveKit.
         */
        console.log('[LIVE] Tentative de connexion à LiveKit...');

        await r.connect(url, token);

        console.log('[LIVE] ✅ Connexion LiveKit réussie');

        if (cancelled) {
          r.disconnect();
          return;
        }

        /*
         * Nombre de participants déjà présents.
         */
        setViewerCount(r.remoteParticipants.size);

        /*
         * Si l'utilisateur est l'hôte,
         * on active sa caméra et son microphone.
         */
        if (host) {
          console.log('[LIVE] Activation caméra et microphone...');

          await r.localParticipant.setCameraEnabled(true);
          await r.localParticipant.setMicrophoneEnabled(true);

          setCamOn(true);
          setMicOn(true);

          /*
           * Recherche de la piste vidéo locale.
           */
          const camPub = Array.from(
            r.localParticipant.videoTrackPublications.values()
          )[0];

          if (camPub?.track && localVideoRef.current) {
            camPub.track.attach(localVideoRef.current);
          }
        }

        setRoom(r);
        setConnecting(false);

      } catch (err: any) {
        console.error(
          '[LIVE] ❌ Erreur de connexion:',
          err
        );

        if (!cancelled) {
          const detail =
            err?.response?.data?.message ||
            err?.message ||
            'Erreur inconnue';

          setError(
            `Impossible de rejoindre le live. Détail : ${detail}`
          );

          setConnecting(false);
        }
      }
    };

    connect();

    /*
     * Nettoyage lorsque le composant est démonté.
     */
    return () => {
      cancelled = true;

      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [postId]);

  /*
   * Activer/désactiver le microphone.
   */
  const toggleMic = async () => {
    if (!room) {
      return;
    }

    try {
      const next = !micOn;

      await room.localParticipant.setMicrophoneEnabled(next);

      setMicOn(next);
    } catch (err) {
      console.error(
        '[LIVE] Erreur microphone:',
        err
      );
    }
  };

  /*
   * Activer/désactiver la caméra.
   */
  const toggleCam = async () => {
    if (!room) {
      return;
    }

    try {
      const next = !camOn;

      await room.localParticipant.setCameraEnabled(next);

      setCamOn(next);
    } catch (err) {
      console.error(
        '[LIVE] Erreur caméra:',
        err
      );
    }
  };

  /*
   * Quitter le live.
   */
  const leave = async () => {
    try {
      room?.disconnect();

      if (isHost && postId) {
        try {
          await api.post(`/live/${postId}/end`);
        } catch (err) {
          console.error(
            '[LIVE] Erreur lors de la fermeture du live:',
            err
          );
        }
      }
    } finally {
      navigate('/feed');
    }
  };

  return (
    <div
      style={{
        height: '100dvh',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Barre supérieure */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          className="btn btn-ghost btn-icon"
          style={{
            color: '#fff',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={leave}
        >
          <ArrowLeft size={20} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              background: '#ff3b30',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.74rem',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            🔴 EN DIRECT
          </span>

          <span
            style={{
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: '0.76rem',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {viewerCount} spectateur
            {viewerCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Connexion */}
      {connecting && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          Connexion au live…
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            padding: 30,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              wordBreak: 'break-word',
            }}
          >
            {error}
          </p>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/feed')}
          >
            Retour au fil
          </button>
        </div>
      )}

      {/* Vidéo de l'hôte */}
      {!connecting &&
        !error &&
        isHost && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

      {/* Vidéo pour les spectateurs */}
      {!connecting &&
        !error &&
        !isHost && (
          <div
            ref={remoteContainerRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {viewerCount === 0 && (
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                }}
              >
                En attente du diffuseur…
              </p>
            )}
          </div>
        )}

      {/* Contrôles de l'hôte */}
      {!connecting &&
        !error &&
        isHost && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            {/* Micro */}
            <button
              onClick={toggleMic}
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                border: 'none',
                background: micOn
                  ? 'rgba(255,255,255,0.2)'
                  : '#ff3b30',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {micOn ? (
                <Mic size={22} />
              ) : (
                <MicOff size={22} />
              )}
            </button>

            {/* Quitter le live */}
            <button
              onClick={leave}
              style={{
                width: 60,
                height: 60,
                borderRadius: 999,
                border: 'none',
                background: '#ff3b30',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneOff size={26} />
            </button>

            {/* Caméra */}
            <button
              onClick={toggleCam}
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                border: 'none',
                background: camOn
                  ? 'rgba(255,255,255,0.2)'
                  : '#ff3b30',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {camOn ? (
                <VideoIcon size={22} />
              ) : (
                <VideoOff size={22} />
              )}
            </button>
          </div>
        )}

      {/* Contrôle du spectateur */}
      {!connecting &&
        !error &&
        !isHost && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={leave}
              style={{
                padding: '10px 24px',
                borderRadius: 999,
                border: 'none',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Quitter
            </button>
          </div>
        )}
    </div>
  );
      }
