import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Gamepad2, Sparkles } from 'lucide-react';
import api from '../services/api';
import TopNav from '../components/TopNav';
import ChatWindow from '../components/ChatWindow';
import { avatarColorFor } from '../utils/avatarColor';
import { useSocket } from '../context/SocketContext';
import { ConversationSummary, Message } from '../types';

interface Hub { id: string; slug: string; name: string; iconUrl: string | null }
interface Category { id: string; slug: string; name: string; iconUrl: string | null }
interface Salon { id: string; name: string; avatarUrl: string | null; memberCount: number; isMember: boolean }

const HUB_ICONS: Record<string, React.ReactNode> = {
  gaming: <Gamepad2 size={26} />,
  divertissement: <Sparkles size={26} />,
};

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const preselectHub = (location.state as any)?.hubSlug as string | undefined;

  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');
  const [creating, setCreating] = useState(false);

  const [activeSalon, setActiveSalon] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const activeSalonIdRef = useRef<string | null>(null);
  activeSalonIdRef.current = activeSalon?.id || null;

  useEffect(() => {
    api.get('/hubs').then((res) => {
      setHubs(res.data.hubs);
      if (preselectHub) {
        const found = res.data.hubs.find((h: Hub) => h.slug === preselectHub);
        if (found) openHub(found);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: Message) => {
      if (msg.conversationId === activeSalonIdRef.current) {
        setMessages((prev) => [...prev, msg]);
        api.post(`/conversations/${msg.conversationId}/read`).catch(() => {});
      }
    };
    const onTyping = ({ conversationId, userId, isTyping }: any) => {
      if (conversationId !== activeSalonIdRef.current) return;
      setTypingUsers((prev) => {
        const current = new Set(prev);
        if (isTyping) current.add(userId);
        else current.delete(userId);
        return Array.from(current);
      });
    };

    socket.on('message:new', onNewMessage);
    socket.on('typing:update', onTyping);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:update', onTyping);
    };
  }, [socket]);

  const openHub = (hub: Hub) => {
    setSelectedHub(hub);
    setSelectedCategory(null);
    setLoading(true);
    api.get(`/hubs/${hub.id}/categories`).then((res) => {
      setCategories(res.data.categories);
      setLoading(false);
    });
  };

  const openCategory = (category: Category) => {
    setSelectedCategory(category);
    setLoading(true);
    api.get(`/hubs/categories/${category.id}/salons`).then((res) => {
      setSalons(res.data.salons);
      setLoading(false);
    });
  };

  const refreshSalons = () => {
    if (selectedCategory) openCategory(selectedCategory);
  };

  const joinSalon = async (salon: Salon) => {
    await api.post(`/hubs/salons/${salon.id}/join`);
    refreshSalons();
  };

  const openSalonChat = async (salon: Salon) => {
    const [summaryRes, messagesRes] = await Promise.all([
      api.get(`/hubs/salons/${salon.id}`),
      api.get(`/conversations/${salon.id}/messages`),
    ]);
    setActiveSalon(summaryRes.data.conversation);
    setMessages(messagesRes.data.messages);
    setTypingUsers([]);
    socket?.emit('conversation:join', { conversationId: salon.id });
    api.post(`/conversations/${salon.id}/read`).catch(() => {});
  };

  const closeSalonChat = () => {
    setActiveSalon(null);
    setMessages([]);
    setTypingUsers([]);
    refreshSalons();
  };

  const sendText = async (content: string) => {
    if (!activeSalon) return;
    await api.post('/messages', { conversationId: activeSalon.id, content, type: 'text' });
  };

  const sendFile = async (file: File) => {
    if (!activeSalon) return;
    const formData = new FormData();
    formData.append('conversationId', activeSalon.id);
    formData.append('file', file);
    await api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeSalon) return;
    socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId: activeSalon.id });
  };

  const createSalon = async () => {
    if (!newSalonName.trim() || !selectedCategory) return;
    setCreating(true);
    try {
      await api.post(`/hubs/categories/${selectedCategory.id}/salons`, { name: newSalonName.trim() });
      setShowCreate(false);
      setNewSalonName('');
      refreshSalons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création du salon.');
    } finally {
      setCreating(false);
    }
  };

  const goBack = () => {
    if (activeSalon) {
      closeSalonChat();
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSalons([]);
    } else if (selectedHub) {
      setSelectedHub(null);
      setCategories([]);
    } else {
      navigate('/settings');
    }
  };

  if (activeSalon) {
    return (
      <div className="app-root" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <TopNav />
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatWindow
            conversation={activeSalon}
            messages={messages}
            typingUsers={typingUsers}
            onlineStatus={{}}
            friends={[]}
            onSendText={sendText}
            onSendFile={sendFile}
            onTyping={handleTyping}
            onStartCall={() => alert("Les appels ne sont pas disponibles dans les salons.")}
            onBack={closeSalonChat}
            onConversationUpdated={() => {}}
            onLeaveGroup={closeSalonChat}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', height: 'calc(100dvh - 58px)' }}>
        <button className="btn btn-ghost" onClick={goBack} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Niveau 1 : Hubs */}
        {!selectedHub && (
          <>
            <h2 style={{ marginBottom: 16 }}>Explorer</h2>
            <div style={{ display: 'flex', gap: 16 }}>
              {hubs.map((h) => (
                <div
                  key={h.id}
                  onClick={() => openHub(h)}
                  className="card"
                  style={{ flex: 1, padding: 20, textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ color: 'var(--accent-strong)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                    {HUB_ICONS[h.slug] || <Sparkles size={26} />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{h.name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Niveau 2 : Catégories */}
        {selectedHub && !selectedCategory && (
          <>
            <h2 style={{ marginBottom: 16 }}>{selectedHub.name}</h2>
            {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
            {!loading && categories.map((c) => (
              <div
                key={c.id}
                onClick={() => openCategory(c)}
                className="card"
                style={{ padding: 16, marginBottom: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem' }}
              >
                {c.name}
              </div>
            ))}
          </>
        )}

        {/* Niveau 3 : Salons */}
        {selectedCategory && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{selectedCategory.name}</h2>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Créer
              </button>
            </div>
            {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
            {!loading && salons.length === 0 && (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Aucun salon pour l'instant — sois le premier à en créer un !
              </div>
            )}
            {!loading && salons.map((s) => (
              <div key={s.id} className="card" style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="avatar"
                  style={{ width: 44, height: 44, background: s.avatarUrl ? undefined : avatarColorFor(s.name), color: '#fff' }}
                >
                  {s.avatarUrl ? (
                    <img src={s.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
                  ) : (
                    <Users size={18} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {s.memberCount} membre{s.memberCount > 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  className={s.isMember ? 'btn btn-secondary' : 'btn btn-primary'}
                  onClick={() => (s.isMember ? openSalonChat(s) : joinSalon(s))}
                >
                  {s.isMember ? 'Ouvrir' : 'Rejoindre'}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="card" style={{ padding: 20, maxWidth: 400, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Créer un salon</h3>
            <input
              className="field"
              placeholder="Nom du salon (ex: eFootball)"
              value={newSalonName}
              onChange={(e) => setNewSalonName(e.target.value)}
              style={{ width: '100%', marginBottom: 14, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={createSalon} disabled={creating}>
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                                             }
