import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { X, Camera, Video, Image as ImageIcon, Radio } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'choice' | 'compose' | 'live'>('choice');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [startingLive, setStartingLive] = useState(false);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('compose');
  };

  const submit = async () => {
    if (!file) return;
    setPosting(true);
    setError('');
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      formData.append('file', file);
      const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onClose();
      navigate(res.data.post.type === 'video' ? '/videos' : '/feed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la publication.');
    } finally {
      setPosting(false);
    }
  };

  const startLive = async () => {
    setStartingLive(true);
    setError('');
    try {
      const res = await api.post('/live/start', { title: liveTitle.trim() });
      onClose();
      navigate(`/live/${res.data.post.id}`, {
        state: { token: res.data.token, url: res.data.url, isHost: true, title: liveTitle.trim() },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du démarrage du live.');
      setStartingLive(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-end' }}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, padding: 20, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>
            {step === 'choice' ? 'Créer' : step === 'live' ? 'Démarrer un live' : 'Nouvelle publication'}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {step === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={() => photoCaptureRef.current?.click()}>
              <Camera size={20} /> Prendre une photo
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={() => videoCaptureRef.current?.click()}>
              <Video size={20} /> Filmer une vidéo
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={() => galleryInputRef.current?.click()}>
              <ImageIcon size={20} /> Choisir depuis la galerie
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={() => setStep('live')}>
              <Radio size={20} color="var(--danger)" /> Démarrer un live
            </button>

            <input ref={photoCaptureRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <input ref={videoCaptureRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <input ref={galleryInputRef} type="file" accept="image/*,video/*" hidden onChange={(e) => handleFile(e.target.files?.[0] || null)} />
          </div>
        )}

        {step === 'live' && (
          <>
            {error && (
              <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Réservé aux vendeurs vérifiés. Votre live apparaîtra dans le fil avec un badge "EN DIRECT".
            </p>
            <input
              className="field"
              placeholder="Titre du live (optionnel)"
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={startLive} disabled={startingLive} style={{ flex: 1 }}>
                {startingLive ? 'Démarrage…' : 'Démarrer'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('choice')}>
                Retour
              </button>
            </div>
          </>
        )}

        {step === 'compose' && (
          <>
            {error && (
              <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {preview && (
              <div style={{ marginBottom: 14, maxHeight: 320, display: 'flex', justifyContent: 'center', background: 'var(--bg-sunken)', borderRadius: 12, overflow: 'hidden' }}>
                {file?.type.startsWith('video/') ? (
                  <video src={preview} controls style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
                ) : (
                  <img src={preview} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
                )}
              </div>
            )}

            <textarea
              className="field"
              placeholder="Ajouter une légende…"
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ marginBottom: 16, resize: 'none' }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={submit} disabled={posting} style={{ flex: 1 }}>
                {posting ? 'Publication…' : 'Publier'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setStep('choice');
                }}
              >
                Changer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
            }
