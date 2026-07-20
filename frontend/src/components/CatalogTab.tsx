import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CatalogItem } from '../types';
import { resolveFileUrl } from '../utils/url';
import { Plus, Trash2, X, ShoppingCart, Minus, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  userId: string;
  type: 'product' | 'service';
  isSelf: boolean;
}

interface CartLine {
  item: CatalogItem;
  qty: number;
}

export default function CatalogTab({ userId, type, isSelf }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [sellerName, setSellerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);

  const load = () => {
    api.get(`/catalog/user/${userId}`, { params: { type } }).then((res) => {
      setItems(res.data.items);
      setSellerName(res.data.seller?.username || '');
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    setCart([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    await api.delete(`/catalog/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDetailItem(null);
  };

  const addToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const changeQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.item.id === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);
  const label = type === 'product' ? 'produit' : 'service';

  const sendOrder = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const lines = cart.map((l) => `• ${l.item.name} x${l.qty}${l.item.price ? ` — ${l.item.price}` : ''}`);
      const text = `Bonjour, je suis intéressé(e) par ces ${type === 'product' ? 'produits' : 'services'} :\n\n${lines.join('\n')}`;

      const res = await api.post('/conversations/private', { userId });
      await api.post('/messages', { conversationId: res.data.conversationId, content: text, type: 'text' });

      setCart([]);
      setShowCart(false);
      navigate('/', { state: { openConversationId: res.data.conversationId } });
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi de la commande.");
    } finally {
      setSending(false);
    }
  };

  const contactSeller = async () => {
    const res = await api.post('/conversations/private', { userId });
    navigate('/', { state: { openConversationId: res.data.conversationId } });
  };

  return (
    <div style={{ position: 'relative', paddingBottom: cartCount > 0 ? 60 : 0 }}>
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

      {/* Rendu façon boutique en ligne */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setDetailItem(item)}>
            <div style={{ position: 'relative' }}>
              {item.images.length > 0 ? (
                <img src={resolveFileUrl(item.images[0])} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 130, background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  {type === 'product' ? '🛍️' : '🛠️'}
                </div>
              )}
              {item.images.length > 1 && (
                <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: 999 }}>
                  +{item.images.length - 1}
                </span>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              {item.price && <div style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>{item.price}</div>}

              {isSelf ? (
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  style={{ padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px', fontSize: '0.78rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                >
                  <ShoppingCart size={14} /> Ajouter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton panier flottant */}
      {!isSelf && cartCount > 0 && (
        <button
          className="btn btn-primary"
          onClick={() => setShowCart(true)}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 30,
            borderRadius: 999, padding: '12px 20px', boxShadow: 'var(--shadow)',
          }}
        >
          <ShoppingCart size={18} /> Panier ({cartCount})
        </button>
      )}

      {/* Vue détail d'un article */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          isSelf={isSelf}
          onClose={() => setDetailItem(null)}
          onAddToCart={() => addToCart(detailItem)}
          onContactSeller={contactSeller}
          onDelete={() => handleDelete(detailItem.id)}
        />
      )}

      {/* Panier */}
      {showCart && (
        <div className="modal-backdrop" onClick={() => setShowCart(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Mon panier</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCart(false)}><X size={18} /></button>
            </div>

            {cart.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Votre panier est vide.</p>}

            {cart.map((l) => (
              <div key={l.item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-sunken)' }}>
                  {l.item.images[0] && <img src={resolveFileUrl(l.item.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{l.item.name}</div>
                  {l.item.price && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.item.price}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => changeQty(l.item.id, -1)}><Minus size={14} /></button>
                  <span style={{ minWidth: 18, textAlign: 'center' }}>{l.qty}</span>
                  <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => changeQty(l.item.id, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 14 }}>
                  Ceci enverra la liste ci-dessus en message à {sellerName || 'la personne'}, qui vous répondra pour finaliser la commande.
                </p>
                <button className="btn btn-primary" onClick={sendOrder} disabled={sending} style={{ width: '100%', marginTop: 8 }}>
                  {sending ? 'Envoi…' : <><MessageCircle size={16} /> Envoyer la commande au vendeur</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

function ItemDetailModal({
  item,
  isSelf,
  onClose,
  onAddToCart,
  onContactSeller,
  onDelete,
}: {
  item: CatalogItem;
  isSelf: boolean;
  onClose: () => void;
  onAddToCart: () => void;
  onContactSeller: () => void;
  onDelete: () => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const images = item.images.length > 0 ? item.images : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative', background: 'var(--bg-sunken)' }}>
          {images.length > 0 ? (
            <img src={resolveFileUrl(images[imgIndex])} alt="" style={{ width: '100%', height: 240, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem' }}>
              {item.type === 'product' ? '🛍️' : '🛠️'}
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                className="btn btn-ghost btn-icon"
                style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
                onClick={() => setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
                onClick={() => setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
              >
                <ChevronRight size={18} />
              </button>
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                {images.map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: 999, background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </div>
            </>
          )}

          <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.4)', color: '#fff' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 6px' }}>{item.name}</h3>
          {item.price && <div style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>{item.price}</div>}
          {item.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>{item.description}</p>}

          {isSelf ? (
            <button className="btn btn-danger" onClick={onDelete} style={{ width: '100%' }}>
              <Trash2 size={16} /> Supprimer cet article
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={onContactSeller} style={{ flex: 1 }}>
                <MessageCircle size={16} /> Contacter
              </button>
              <button className="btn btn-primary" onClick={onAddToCart} style={{ flex: 1 }}>
                <ShoppingCart size={16} /> Ajouter au panier
              </button>
            </div>
          )}
        </div>
      </div>
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const label = type === 'product' ? 'produit' : 'service';

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).slice(0, 6 - files.length);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 6));
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))].slice(0, 6));
  };

  const removeImage = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

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
      files.forEach((f) => formData.append('files', f));

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

        <label className="field-label">Photos (jusqu'à 6)</label>
        <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} style={{ marginBottom: 10 }} disabled={files.length >= 6} />

        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', width: 60, height: 60 }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => removeImage(i)}
                  style={{ position: 'absolute', top: -6, right: -6, padding: 2, width: 20, height: 20, minWidth: 20 }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-primary" onClick={submit} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Création…' : 'Publier'}
        </button>
      </div>
    </div>
  );
}
