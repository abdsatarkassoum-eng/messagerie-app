import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import { PostItem } from '../types';
import { resolveFileUrl } from '../utils/url';

interface MarketplaceItem {
  id: string;
  name: string;
  price: string | null;
  images: string[];
  saleLink: string | null;
  owner: { id: string; username: string } | null;
}

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketItems, setMarketItems] = useState<MarketplaceItem[]>([]);

  useEffect(() => {
    api.get('/posts').then((res) => {
      setPosts(res.data.posts);
      setLoading(false);
    });
    api.get('/catalog').then((res) => setMarketItems(res.data.items.slice(0, 12))).catch(() => {});
  }, []);

  const openItem = (item: MarketplaceItem) => {
    if (item.saleLink) {
      window.open(item.saleLink, '_blank', 'noopener,noreferrer');
    } else if (item.owner) {
      navigate(`/profile/${item.owner.id}`);
    }
  };

  return (
    <div className="app-root" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0, boxSizing: 'border-box' }}>
        {marketItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 10 }}>Marketplace</h3>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, touchAction: 'pan-x', overscrollBehaviorX: 'contain' as any }}>
              {marketItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openItem(item)}
                  style={{ minWidth: 140, maxWidth: 140, flexShrink: 0, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', position: 'relative', background: 'var(--bg-sunken)' }}
                >
                  <div style={{ width: '100%', height: 140 }}>
                    {item.images[0] ? (
                      <img src={resolveFileUrl(item.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                        {item.name}
                      </div>
                    )}
                  </div>
                  {item.price && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 8px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.76rem', fontWeight: 700,
                    }}>
                      {item.price}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <CreatePostBox onCreated={(post) => setPosts((prev) => [post, ...prev])} />

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chargement du fil…</p>}

        {!loading && posts.length === 0 && (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Aucune publication pour l'instant. Soyez le premier à partager quelque chose !
            </p>
          </div>
        )}

        {posts.map((p) => (
          <PostCard key={p.id} post={p} onDeleted={(id: string) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
        ))}
      </div>
      <BottomNav active="home" showVideo showCreateButton />
    </div>
  );
}
