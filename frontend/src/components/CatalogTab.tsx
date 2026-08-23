import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LinkPreview } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { Store, Briefcase, ExternalLink, MessageCircle, Pencil, Plus, Trash2, X, Rocket } from 'lucide-react';

interface Props {
  userId: string;
  type: 'product' | 'service';
  isSelf: boolean;
}

interface CatalogItemData {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  images: string[];
  saleLink: string | null;
  boostAmount?: number;
  boostedUntil?: string | null;
  isBoosted?: boolean;
}

const BOOST_OPTIONS = [
  { days: 1, price: 500 },
  { days: 3, price: 1300 },
  { days: 7, price: 2800 },
];

function PreviewCard({
  preview,
  type,
  ownerAvatarUrl,
  ownerUsername,
}: {
  preview: LinkPreview | null;
  type: 'product' | 'service';
  ownerAvatarUrl: string | null;
  ownerUsername: string;
}) {
  const Icon = type === 'product' ? Store : Briefcase;

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
      {preview?.image ? (
        <img src={preview.image} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
      ) : ownerAvatarUrl ? (
        <div style={{ position: 'relative', width: '100%', height: 150, overflow: 'hidden', background: avatarColorFor(ownerUsername) }}>
          <img
            src={resolveFileUrl(ownerAvatarUrl)}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(0.75)', transform: 'scale(1.15)' }}
          />
          <img
            src={resolveFileUrl(ownerAvatarUrl)}
            alt=""
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 76, height: 76, borderRadius: 999, objectFit: 'cover', border: '3px solid #fff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          />
        </div>
      ) : (
        <div style={{ width: '100%', height: 100, background: avatarColorFor(ownerUsername), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.4rem' }}>
            {ownerUsername[0]?.toUpperCase()}
          </div>
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
        {!preview?.title && (
          <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={14} /> {type === 'product' ? `Boutique de ${ownerUsername}` : `Services de ${ownerUsername}`}
          </div>
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
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState<CatalogItemData[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemSaleLink, setItemSaleLink] = useState('');
  const [itemFiles, setItemFiles] = useState<File[]>([]);
  const [creatingItem, setCreatingItem] = useState(false);

  const [boostingItem, setBoostingItem] = useState<CatalogItemData | null>(null);
  const [boostDays, setBoostDays] = useState(1);
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostStatus, setBoostStatus] = useState('');

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
      setSellerAvatar(res.data.user.avatarUrl || null);

      const itemsRes = await api.get(`/catalog/user/${userId}`, { params: { type } });
      setItems(itemsRes.data.items);
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

  const createItem = async () => {
    if (!itemName.trim()) return;
    setCreatingItem(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('name', itemName.trim());
      formData.append('description', itemDescription.trim());
      formData.append('price', itemPrice.trim());
      formData.append('saleLink', itemSaleLink.trim());
      itemFiles.forEach((f) => formData.append('files', f));

      const res = await api.post('/catalog', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems((prev) => [res.data.item, ...prev]);
      setShowAddItem(false);
      setItemName('');
      setItemPrice('');
      setItemDescription('');
      setItemSaleLink('');
      setItemFiles([]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la création de l'article.");
    } finally {
      setCreatingItem(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    await api.delete(`/catalog/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startBoost = async () => {
    if (!boostingItem) return;
    setBoostLoading(true);
    setBoostStatus('Redirection vers le paiement…');
    try {
      const res = await api.post('/boost/initiate', { itemId: boostingItem.id, days: boostDays });
      window.open(res.data.checkoutUrl, '_blank');
      setBoostStatus('En attente du paiement…');

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const checkRes = await api.get(`/boost/check/${res.data.transactionId}`);
          if (checkRes.data.confirmed) {
            clearInterval(poll);
            setBoostStatus('Boost activé ! 🚀');
            setItems((prev) => prev.map((i) => (i.id === boostingItem.id ? { ...i, ...checkRes.data.item, isBoosted: true } : i)));
            setTimeout(() => {
              setBoostingItem(null);
              setBoostLoading(false);
              setBoostStatus('');
            }, 1200);
          } else if (attempts >= 20) {
            clearInterval(poll);
            setBoostStatus("Paiement non confirmé. Si vous avez payé, revenez plus tard.");
            setBoostLoading(false);
          }
        } catch {
          // on continue à réessayer
        }
      }, 3000);
    } catch (err: any) {
      setBoostStatus(err.response?.data?.message || 'Erreur lors du boostage.');
      setBoostLoading(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>;
  }

  return (
    <div>
      {isSelf ? (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Icon size={20} color="var(--accent-strong)" />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>
              {type === 'product' ? 'Votre boutique externe' : 'Vos services externes'}
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
                <PreviewCard preview={preview} type={type} ownerAvatarUrl={sellerAvatar} ownerUsername={sellerName} />
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
                  Optionnel : ajoutez le lien vers votre {label} externe (Facebook, WhatsApp Business, Instagram, site web…).
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
                L'aperçu (image, titre) sera récupéré automatiquement à l'enregistrement.
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
      ) : (
        link && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <PreviewCard preview={preview} type={type} ownerAvatarUrl={sellerAvatar} ownerUsername={sellerName} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <ExternalLink size={16} /> {type === 'product' ? 'Voir la boutique' : 'Voir les services'}
              </a>
              <button className="btn btn-secondary" onClick={contactSeller}>
                <MessageCircle size={16} /> Contacter {sellerName}
              </button>
            </div>
          </div>
        )
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>
          {type === 'product' ? 'Articles publiés' : 'Services publiés'}
        </h3>
        {isSelf && (
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setShowAddItem(true)}>
            <Plus size={14} /> Ajouter
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: 20 }}>
          {isSelf ? "Vous n'avez encore rien publié." : `${sellerName} n'a encore rien publié.`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            {item.isBoosted && (
              <span style={{
                position: 'absolute', top: 8, left: 8, zIndex: 2, background: '#ffb84d', color: '#000',
                fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999,
              }}>
                Sponsorisé
              </span>
            )}
            <div style={{ width: '100%', height: 110, background: 'var(--bg-sunken)' }}>
              {item.images[0] && (
                <img src={resolveFileUrl(item.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </div>
              {item.price && <div style={{ fontSize: '0.8rem', color: 'var(--accent-strong)', fontWeight: 700, marginBottom: 8 }}>{item.price}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.saleLink && (
                  <a href={item.saleLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: '5px', fontSize: '0.74rem', textDecoration: 'none', textAlign: 'center' }}>
                    Voir
                  </a>
                )}
                {isSelf && (
                  <>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '5px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      onClick={() => { setBoostingItem(item); setBoostDays(1); setBoostStatus(''); }}
                    >
                      <Rocket size={12} /> Booster
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => deleteItem(item.id)} title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddItem && (
        <div className="modal-backdrop" onClick={() => setShowAddItem(false)}>
          <div className="card" style={{ padding: 20, maxWidth: 420, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{type === 'product' ? 'Nouvel article' : 'Nouveau service'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddItem(false)}><X size={18} /></button>
            </div>

            <label className="field-label">Nom</label>
            <input className="field" value={itemName} onChange={(e) => setItemName(e.target.value)} style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }} />

            <label className="field-label">Prix (ex: 15 000 FCFA)</label>
            <input className="field" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }} />

            <label className="field-label">Description</label>
            <textarea className="field" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} rows={3} style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }} />

            <label className="field-label">Lien de vente (WhatsApp, Facebook, site…)</label>
            <input className="field" value={itemSaleLink} onChange={(e) => setItemSaleLink(e.target.value)} placeholder="https://..." style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }} />

            <label className="field-label">Photos (jusqu'à 6)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setItemFiles(Array.from(e.target.files || []).slice(0, 6))}
              style={{ marginBottom: 16, width: '100%' }}
            />

            <button className="btn btn-primary" onClick={createItem} disabled={creatingItem || !itemName.trim()} style={{ width: '100%' }}>
              {creatingItem ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </div>
      )}

      {boostingItem && (
        <div className="modal-backdrop" onClick={() => !boostLoading && setBoostingItem(null)}>
          <div className="card" style={{ padding: 20, maxWidth: 380, width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Booster "{boostingItem.name}"</h3>
              {!boostLoading && (
                <button className="btn btn-ghost btn-icon" onClick={() => setBoostingItem(null)}><X size={18} /></button>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Fait remonter votre article en tête de la Marketplace, avec un badge "Sponsorisé".
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {BOOST_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setBoostDays(opt.days)}
                  disabled={boostLoading}
                  className={boostDays === opt.days ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                >
                  <span>{opt.days} jour{opt.days > 1 ? 's' : ''}</span>
                  <span>{opt.price.toLocaleString('fr-FR')} FCFA</span>
                </button>
              ))}
            </div>
            {boostStatus && (
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-strong)', marginBottom: 14, textAlign: 'center' }}>{boostStatus}</p>
            )}
            <button className="btn btn-primary" onClick={startBoost} disabled={boostLoading} style={{ width: '100%' }}>
              {boostLoading ? 'Traitement…' : 'Payer et booster'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
    }
