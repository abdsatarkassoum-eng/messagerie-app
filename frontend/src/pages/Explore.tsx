import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Gamepad2, Sparkles, ChevronRight } from 'lucide-react';
import api from '../services/api';
import TopNav from '../components/TopNav';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import { ConversationSummary, Message } from '../types';

interface Hub { id: string; slug: string; name: string; iconUrl: string | null }
interface Category { id: string; slug: string; name: string; iconUrl: string | null }
interface Salon { id: string; name: string; avatarUrl: string | null; memberCount: number; isMember: boolean }

const HUB_ICONS: Record<string, React.ReactNode> = {
  gaming: <Gamepad2 size={30} />,
  divertissement: <Sparkles size={30} />,
};

const HUB_GRADIENTS: Record<string, string> = {
  gaming: 'linear-gradient(135deg, #1f7a6c 0%, #0d3b33 100%)',
  divertissement: 'linear-gradient(135deg, #ff5f8f 0%, #7c3aed 100%)',
};

const DARK = {
  bg: '#0a0c10',
  surface: '#15181f',
  surfaceRaised: '#1b1f28',
  border: '#262b35',
  text: '#f5f6f8',
  textMuted: '#8b93a1',
  accentGradient: 'linear-gradient(90deg, #ff5f8f 0%, #ff9d5c 50%, #7c3aed 100%)',
  accentSolid: '#ff5f8f',
};

const salonAvatarGradient = (name: string) => {
  const hues = [280, 330, 15, 165, 195];
  const hue = hues[name.charCodeAt(0) % hues.length];
  return `linear-gradient(135deg, hsl(${hue},70%,45%), hsl(${(hue + 40) % 360},70%,30%))`;
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
      <div
        style={{
          background: DARK.bg,
          minHeight: 'calc(100dvh - 58px)',
          padding: '20px 16px 40px',
          overflowY: 'auto',
          height: 'calc(100dvh - 58px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <button
            onClick={goBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              color: DARK.textMuted, fontSize: '0.9rem', fontWeight: 600, padding: '8px 0', marginBottom: 12, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {/* Niveau 1 : Hubs */}
          {!selectedHub && (
            <>
              <h2 style={{ color: DARK.text, margin: '4px 0 4px', fontSize: '1.4rem', fontWeight: 800 }}>Explorer</h2>
              <p style={{ color: DARK.textMuted, margin: '0 0 20px', fontSize: '0.88rem' }}>
                Rejoins une communauté par centre d'intérêt.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {hubs.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => openHub(h)}
                    style={{
                      position: 'relative',
                      borderRadius: 18,
                      padding: 24,
                      cursor: 'pointer',
                      background: HUB_GRADIENTS[h.slug] || DARK.accentGradient,
                      overflow: 'hidden',
                      minHeight: 96,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 54, height: 54, borderRadius: 14, background: 'rgba(0,0,0,0.28)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {HUB_ICONS[h.slug] || <Sparkles size={28} />}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{h.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>Voir les catégories</div>
                      </div>
                    </div>
                    <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Niveau 2 : Catégories */}
          {selectedHub && !selectedCategory && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10, background: HUB_GRADIENTS[selectedHub.slug],
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
                  }}
                >
                  {HUB_ICONS[selectedHub.slug] || <Sparkles size={20} />}
                </div>
                <h2 style={{ color: DARK.text, margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{selectedHub.name}</h2>
              </div>
              {loading && <p style={{ color: DARK.textMuted }}>Chargement…</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!loading && categories.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openCategory(c)}
                    style={{
                      background: DARK.surface,
                      border: `1px solid ${DARK.border}`,
                      borderRadius: 14,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: DARK.text, fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</span>
                    <ChevronRight size={18} color={DARK.textMuted} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Niveau 3 : Salons */}
          {selectedCategory && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ color: DARK.text, margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{selectedCategory.name}</h2>
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 999,
                    padding: '9px 16px', fontWeight: 700, fontSize: '0.85rem', color: '#fff',
                    background: DARK.accentGradient, cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Créer
                </button>
              </div>
              {loading && <p style={{ color: DARK.textMuted }}>Chargement…</p>}
              {!loading && salons.length === 0 && (
                <div
                  style={{
                    background: DARK.surface, border: `1px dashed ${DARK.border}`, borderRadius: 16,
                    padding: 28, textAlign: 'center', color: DARK.textMuted, fontSize: '0.88rem',
                  }}
                >
                  Aucun salon pour l'instant — sois le premier à en créer un !
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!loading && salons.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: DARK.surfaceRaised, border: `1px solid ${DARK.border}`, borderRadius: 16,
                      padding: 14, display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                        background: s.avatarUrl ? undefined : salonAvatarGradient(s.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}
                    >
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: DARK.text, fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</div>
                      <div style={{ color: DARK.textMuted, fontSize: '0.78rem' }}>
                        {s.memberCount} membre{s.memberCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => (s.isMember ? openSalonChat(s) : joinSalon(s))}
                      style={{
                        border: s.isMember ? `1px solid ${DARK.border}` : 'none',
                        borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: '0.82rem',
                        cursor: 'pointer',
                        color: s.isMember ? DARK.text : '#fff',
                        background: s.isMember ? DARK.surface : DARK.accentGradient,
                      }}
                    >
                      {s.isMember ? 'Ouvrir' : 'Rejoindre'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div
          onClick={() => setShowCreate(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: DARK.surfaceRaised, border: `1px solid ${DARK.border}`, borderRadius: 18, padding: 22, maxWidth: 400, width: '100%' }}
          >
            <h3 style={{ color: DARK.text, marginTop: 0, marginBottom: 14 }}>Créer un salon</h3>
            <input
              placeholder="Nom du salon (ex: eFootball)"
              value={newSalonName}
              onChange={(e) => setNewSalonName(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '12px 14px',
                borderRadius: 10, border: `1px solid ${DARK.border}`, background: DARK.bg, color: DARK.text, fontSize: '0.9rem',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${DARK.border}`,
                  background: 'transparent', color: DARK.text, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={createSalon}
                disabled={creating}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: DARK.accentGradient, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
