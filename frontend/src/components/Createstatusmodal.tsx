import React, { useState } from 'react';
import api from '../services/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const COLORS = ['#1f7a6c', '#ff6b4a', '#2b3a55', '#7a3b8f', '#c2410c', '#0e7490'];

export default function CreateStatusModal({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [text, setText] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (tab === 'text' && !text.trim()) {
      setError('Écrivez quelque chose pour votre statut.');
      return;
    }
    if (tab === 'media' && !file) {
      setError('Choisissez une photo ou une vidéo.');
      return;
    }

    setPosting(true);
    try {
      if (tab === 'text') {
        await api.post('/statuses', { type: 'text', content: text.trim(), backgroundColor: color });
      } else {
        const formData = new FormData();
        formData.append('file', file as File);
        if (caption.trim()) formData.append('content', caption.trim());
        await api.post('/statuses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la publication.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Nouveau statut</h2>

        <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
          <div className={`tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>Texte</div>
          <div className={`tab ${tab === 'media' ? 'active' : ''}`} onClick={() => setTab('media')}>Photo / Vidéo</div>
        </div>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {tab === 'text' ? (
          <>
            <div
              style={{
                background: color,
                color: '#fff',
                borderRadius: 16,
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                marginBottom: 14,
                textAlign: 'center',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {text || 'Votre texte apparaîtra ici…'}
            </div>
            <textarea
              className="field"
              rows={2}
              placeholder="Quoi de neuf ?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid var(--text)' : '3px solid transparent',
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ marginBottom: 14 }}
            />
            {file && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Sélectionné : {file.name}
              </p>
            )}
            <input
              className="field"
              placeholder="Légende (optionnel)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ marginBottom: 18 }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={submit} disabled={posting} style={{ flex: 1 }}>
            {posting ? 'Publication…' : 'Publier'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
  }
