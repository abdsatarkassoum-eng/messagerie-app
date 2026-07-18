import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CatalogItem } from '../types';
import { resolveFileUrl } from '../utils/url';
import { Plus, Trash2, X } from 'lucide-react';

interface Props {
  userId: string;
  type: 'product' | 'service';
  isSelf: boolean;
}

export default function CatalogTab({ userId, type, isSelf }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    api.get(`/catalog/user/${userId}`, { params: { type } }).then((res) => {
      setItems(res.data.items);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    await api.delete(`/catalog/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const label = type === 'product' ? 'produit' : 'service';

  return (
    <div>
      {isSelf && (
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginBottom: 16, width: '100%' }}>
          <Plus size={16} /> Ajouter un {label}
        </button>
      )}

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
      {!loading && items.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          Aucun {label} pour l'instant.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ overflow: 'hidden' }}>
            {item.fileUrl ? (
              <img src={resolveFileUrl(item.fileUrl)} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: 110, background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                {type === 'product' ? '🛍️' : '🛠️'}
              </div>
            )}
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>{item.name}</div>
              {item.price && <div style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: '0.86rem', marginBottom: 4 }}>{item.price}</div>}
              {item.description && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{item.description}</div>
              )}
              {isSelf && (
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(item.id)} style={{ padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateCatalogItemModal
          type={type}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateCatalogItemModal({
  type,
  onClose,
  onCreated,
}: {
  type: 'product' | 'service';
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const label = type === 'product' ? 'produit' : 'service';

  const submit = async () => {
    if (!name.trim()) {
      setError('Le nom est requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('name', name.trim());
      if (price.trim()) formData.append('price', price.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (file) formData.append('file', file);

      await api.post('/catalog', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Nouveau {label}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <label className="field-label">Nom</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 12 }} />

        <label className="field-label">Prix (optionnel, texte libre)</label>
        <input className="field" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex : 5000 FCFA, Sur devis…" style={{ marginBottom: 12 }} />

        <label className="field-label">Description (optionnel)</label>
        <textarea className="field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginBottom: 12 }} />

        <label className="field-label">Photo (optionnel)</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ marginBottom: 18 }} />

        <button className="btn btn-primary" onClick={submit} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Création…' : 'Publier'}
        </button>
      </div>
    </div>
  );
}
