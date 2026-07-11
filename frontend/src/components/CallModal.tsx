import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { UserProfile } from '../types';

export interface CallSession {
  isIncoming: boolean;
  callType: 'audio' | 'video';
  peer: UserProfile;
  offer?: RTCSessionDescriptionInit;
}

interface Props {
  socket: Socket;
  session: CallSession;
  onClose: () => void;
}

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function CallModal({ socket, session, onClose }: Props) {
  const [status, setStatus] = useState<'ringing' | 'connecting' | 'active'>(
    session.isIncoming ? 'ringing' : 'connecting'
  );
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!session.isIncoming) {
      startCall();
    }

    socket.on('call:answered', handleAnswered);
    socket.on('call:ice-candidate', handleRemoteCandidate);
    socket.on('call:declined', handleRemoteEnd);
    socket.on('call:ended', handleRemoteEnd);

    return () => {
      socket.off('call:answered', handleAnswered);
      socket.off('call:ice-candidate', handleRemoteCandidate);
      socket.off('call:declined', handleRemoteEnd);
      socket.off('call:ended', handleRemoteEnd);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', { targetUserId: session.peer.id, candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function getLocalStream() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: session.callType === 'video',
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function startCall() {
    try {
      const pc = createPeerConnection();
      const stream = await getLocalStream();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:invite', {
        targetUserId: session.peer.id,
        offer,
        callType: session.callType,
      });
    } catch (err) {
      console.error('Erreur lors du démarrage de l\'appel', err);
      onClose();
    }
  }

  async function acceptCall() {
    try {
      setStatus('connecting');
      const pc = createPeerConnection();
      const stream = await getLocalStream();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(session.offer!));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', { targetUserId: session.peer.id, answer });
      setStatus('active');
    } catch (err) {
      console.error('Erreur lors de la réponse à l\'appel', err);
      onClose();
    }
  }

  async function handleAnswered({ answer }: any) {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setStatus('active');
    }
  }

  async function handleRemoteCandidate({ candidate }: any) {
    try {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      /* silencieux */
    }
  }

  function handleRemoteEnd() {
    cleanup();
    onClose();
  }

  function cleanup() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  }

  function declineCall() {
    socket.emit('call:decline', { targetUserId: session.peer.id });
    cleanup();
    onClose();
  }

  function endCall() {
    socket.emit('call:end', { targetUserId: session.peer.id });
    cleanup();
    onClose();
  }

  return (
    <div className="call-overlay">
      <h2 style={{ margin: 0 }}>{session.peer.username}</h2>
      <p style={{ opacity: 0.8, margin: 0 }}>
        {status === 'ringing' && `Appel ${session.callType === 'video' ? 'vidéo' : 'audio'} entrant…`}
        {status === 'connecting' && 'Connexion en cours…'}
        {status === 'active' && (session.callType === 'video' ? 'Appel vidéo en cours' : 'Appel audio en cours')}
      </p>

      {session.callType === 'video' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <video ref={remoteVideoRef} autoPlay playsInline className="call-video" />
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: 160, borderRadius: 12 }} />
        </div>
      )}

      <div className="call-controls">
        {status === 'ringing' ? (
          <>
            <button className="call-btn" style={{ background: 'var(--online)' }} onClick={acceptCall}>✅</button>
            <button className="call-btn" style={{ background: 'var(--danger)' }} onClick={declineCall}>✖</button>
          </>
        ) : (
          <button className="call-btn" style={{ background: 'var(--danger)' }} onClick={endCall}>📞</button>
        )}
      </div>
    </div>
  );
}
