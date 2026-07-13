import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostItem } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { Image as ImageIcon, X } from 'lucide-react';

interface Props {
  onCreated: (post: PostItem) => void;
}

export default function CreatePostBox({ onCreated }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const handleFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async () => {
    if (!content.trim() && !file) return;
    setPosting(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (file) formData.append('file', file);
      const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(res.data.post);
      setContent('');
      handleFile(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la publication.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div
          className="avatar"
          style={{ width: 40, height: 40, background: user?.avatarUrl ? undefined : avatarColorFor(user?.username || '?'), color: '#fff' }}
        >
          {user?.avatarUrl ? (
            <img src={resolveFileUrl(user.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
          ) : (
            user?.username[0]?.toUpperCase()
          )}
        </div>
        <textarea
          className="field"
          placeholder={`À quoi pensez-vous, ${user?.username} ?`}
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: 'none' }}
        />
      </div>

      {preview && (
        <div style={{ position: 'relative', marginTop: 12 }}>
          {file?.type.startsWith('video/') ? (
            <video src={preview} controls style={{ maxWidth: '100%', borderRadius: 12 }} />
          ) : (
            <img src={preview} alt="" style={{ maxWidth: '100%', borderRadius: 12 }} />
          )}
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => handleFile(null)}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
          <ImageIcon size={18} /> Photo / Vidéo
          <input
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </label>
        <button className="btn btn-primary" onClick={submit} disabled={posting || (!content.trim() && !file)}>
          {posting ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </div>
  );
}
