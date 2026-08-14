import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Store, Briefcase, ExternalLink, MessageCircle, Pencil } from 'lucide-react';

interface Props {
  userId: string;
  type: 'product' | 'service';
  isSelf: boolean;
}

export default function CatalogTab({ userId, type, isSelf }: Props) {
  const navigate = useNavigate();
  const [link, setLink] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const linkField = type === 'product' ? 'productsLink' : 'servicesLink';
  const label = type === 'product' ? 'boutique' : 'page de services';
  const Icon = type === 'product' ? Store : Briefcase;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      const value = (res.data.user as any)[linkField] || null;
      setLink(value);
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

  // --- Vue du propriétaire du profil : configurer le lien ---
  if (isSelf) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Icon size={20} color="var(--accent-strong)" />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            {type === 'product' ? 'Lien de votre boutique' : 'Lien de vos services'}
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
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 16 }}>
                {link}
              </p>
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
                Les visiteurs de votre profil pourront y accéder directement.
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
              style={{ marginBottom: 14 }}
            />
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

  // --- Vue d'un visiteur ---
  if (!link) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        {sellerName} n'a pas encore ajouté de {label}.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28, textAlign: 'center' }}>
      <Icon size={36} color="var(--accent-strong)" style={{ marginBottom: 12 }} />
      <h3 style={{ margin: '0 0 6px' }}>
        {type === 'product' ? `Boutique de ${sellerName}` : `Services de ${sellerName}`}
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, wordBreak: 'break-all' }}>
        {link}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <ExternalLink size={16} /> {type === 'product' ? 'Visiter la boutique' : 'Voir les services'}
        </a>
        <button className="btn btn-secondary" onClick={contactSeller}>
          <MessageCircle size={16} /> Contacter {sellerName}
        </button>
      </div>
    </div>
  );
}
