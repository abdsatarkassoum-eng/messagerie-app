import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { X, Camera, Image as ImageIcon, Radio } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'choice' | 'compose'>('choice');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('compose');
  };

  const showLiveComingSoon = () => {
    alert('Le live arrive bientôt ! On y travaille — en attendant, vous pouvez publier une vidéo classique.');
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
      // Redirige vers le fil vidéo si c'est une vidéo, sinon le fil d'actualité classique
      navigate(res.data.post.type === 'video' ? '/videos' : '/feed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la publication.');
    } finally {
      setPosting(false);
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
          <h3 style={{ margin: 0 }}>{step === 'choice' ? 'Créer' : 'Nouvelle publication'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {step === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={() => cameraInputRef.current?.click()}>
              <Camera size={20} /> Prendre une photo ou une vidéo
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={() => galleryInputRef.current?.click()}>
              <ImageIcon size={20} /> Choisir depuis la galerie
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 16px' }} onClick={showLiveComingSoon}>
              <Radio size={20} color="var(--danger)" /> Démarrer un live <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Bientôt</span>
            </button>

            {/* Champs cachés : "capture" force l'ouverture de l'appareil photo sur mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </div>
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
