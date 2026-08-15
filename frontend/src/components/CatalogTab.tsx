import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LinkPreview } from '../types';
import { Store, Briefcase, ExternalLink, MessageCircle, Pencil } from 'lucide-react';

interface Props {
  userId: string;
  type: 'product' | 'service';
  isSelf: boolean;
}

function PreviewCard({ preview, type }: { preview: LinkPreview | null; type: 'product' | 'service' }) {
  const Icon = type === 'product' ? Store : Briefcase;
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
      {preview?.image ? (
        <img src={preview.image} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: 100, background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={30} color="var(--accent-strong)" />
        </div>
      )}
      <div style={{ padding: '10px 14px', background: 'var(--bg-sunken)' }}>
        {preview?.title && (
          <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {preview.title}
          </div>
        )}
        {preview?.description && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {preview.description}
          </div>
        )}
        {preview?.domain && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{preview.domain}</div>
        )}
      </div>
    </div>
  );
}

export default function CatalogTab({ userId, type, isSelf }: Props) {
  const navigate = useNavigate();
  const [link, setLink] = useState<string | null>(null);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const linkField = type === 'product' ? 'productsLink' : 'servicesLink';
  const previewField = type === 'product' ? 'productsLinkPreview' : 'servicesLinkPreview';
  const label = type === 'product' ? 'boutique' : 'page de services';
  const Icon = type === 'product' ? Store : Briefcase;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      const value = (res.data.user as any)[linkField] || null;
      setLink(value);
      setPreview((res.data.user as any)[previewField] || null);
      setDraft(value || '');
      setSellerName(res.data.user.username);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setEditing(false);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append(linkField, draft.trim());
      const res = await api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLink((res.data.user as any)[linkField] || null);
      setPreview((res.data.user as any)[previewField] || null);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const contactSeller = async () => {
    const res = await api.post('/conversations/private', { userId });
    navigate('/', { state: { openConversationId: res.data.conversationId } });
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>;
  }

  // --- Vue du propriétaire du profil ---
  if (isSelf) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Icon size={20} color="var(--accent-strong)" />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            {type === 'product' ? 'Votre boutique' : 'Vos services'}
          </h3>
        </div>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {!editing ? (
          link ? (
            <>
              <PreviewCard preview={preview} type={type} />
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
                  <ExternalLink size={16} /> Voir
                </a>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                  <Pencil size={16} /> Modifier
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Ajoutez le lien vers votre {label} (Facebook, WhatsApp Business, Instagram, site web…).
                Les visiteurs de votre profil verront un aperçu et pourront s'y rendre en un tap.
              </p>
              <button className="btn btn-primary" onClick={() => setEditing(true)} style={{ width: '100%' }}>
                Ajouter le lien
              </button>
            </>
          )
        ) : (
          <>
            <label className="field-label">Lien (URL complète)</label>
            <input
              className="field"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://..."
              style={{ marginBottom: 6 }}
            />
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              L'aperçu (image, titre) sera récupéré automatiquement à l'enregistrement — ça peut prendre quelques secondes.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDraft(link || '');
                  setEditing(false);
                  setError('');
                }}
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- Vue d'un visiteur : aperçu + bouton, jamais l'adresse brute ---
  if (!link) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        {sellerName} n'a pas encore ajouté de {label}.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <PreviewCard preview={preview} type={type} />
      {!preview?.title && (
        <p style={{ textAlign: 'center', fontSize: '0.92rem', fontWeight: 600, margin: '0 0 14px' }}>
          {type === 'product' ? `Boutique de ${sellerName}` : `Services de ${sellerName}`}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <ExternalLink size={16} /> {type === 'product' ? 'Voir la boutique' : 'Voir les services'}
        </a>
        <button className="btn btn-secondary" onClick={contactSeller}>
          <MessageCircle size={16} /> Contacter {sellerName}
        </button>
      </div>
    </div>
  );
                }
