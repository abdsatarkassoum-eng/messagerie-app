import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TopNav from '../components/TopNav';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { ArrowLeft, Search, Users } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  name: string;
  price: string | null;
  images: string[];
  saleLink: string | null;
  isBoosted: boolean;
  owner: { id: string; username: string; avatarUrl: string | null } | null;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = (query = '') => {
    setLoading(true);
    api.get('/catalog', { params: { search: query } }).then((res) => {
      setItems(res.data.items);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openItem = (item: MarketplaceItem) => {
    if (item.saleLink) {
      window.open(item.saleLink, '_blank', 'noopener,noreferrer');
    } else if (item.owner) {
      navigate(`/profile/${item.owner.id}`);
    }
  };

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', height: 'calc(100dvh - 58px)' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/feed')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <h2 style={{ marginBottom: 16 }}>Marketplace</h2>

        <div style={{ position: 'relative', marginBottom: 18 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="field"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chargement…</p>}

        {!loading && items.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            Aucun produit trouvé.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {!loading && items.map((item) => (
            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => openItem(item)}>
              {item.isBoosted && (
                <span style={{
                  position: 'absolute', top: 8, left: 8, zIndex: 2, background: '#ffb84d', color: '#000',
                  fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                }}>
                  Sponsorisé
                </span>
              )}
              <div style={{ width: '100%', height: 130, background: 'var(--bg-sunken)' }}>
                {item.images[0] ? (
                  <img src={resolveFileUrl(item.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Users size={24} />
                  </div>
                )}
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                {item.price && <div style={{ fontSize: '0.8rem', color: 'var(--accent-strong)', fontWeight: 700, marginBottom: 6 }}>{item.price}</div>}
                {item.owner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      className="avatar"
                      style={{ width: 18, height: 18, fontSize: '0.6rem', background: item.owner.avatarUrl ? undefined : avatarColorFor(item.owner.username), color: '#fff' }}
                    >
                      {item.owner.avatarUrl ? (
                        <img src={resolveFileUrl(item.owner.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                      ) : (
                        item.owner.username[0]?.toUpperCase()
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.owner.username}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
