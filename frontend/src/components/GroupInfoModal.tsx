import React, { useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConversationSummary, UserProfile } from '../types';
import { resolveFileUrl } from '../utils/url';
import { avatarColorFor } from '../utils/avatarColor';
import { X, Camera, Pencil, Check, UserPlus, ShieldCheck, Shield, UserMinus, LogOut } from 'lucide-react';

interface Props {
  conversation: ConversationSummary;
  friends: UserProfile[];
  onClose: () => void;
  onUpdated: () => void;
  onLeft: () => void;
}

export default function GroupInfoModal({ conversation, friends, onClose, onUpdated, onLeft }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(conversation.name);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user ? conversation.memberRoles[user.id] === 'admin' : false;
  const addableFriends = friends.filter((f) => !conversation.members.some((m) => m.id === f.id));

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.put(`/groups/${conversation.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du changement de photo.");
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === conversation.name) {
      setEditingName(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', nameDraft.trim());
      await api.put(`/groups/${conversation.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUpdated();
      setEditingName(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du changement de nom.');
    } finally {
      setBusy(false);
    }
  };

  const addMember = async (userId: string) => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/groups/${conversation.id}/members`, { userId });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId: string, username: string) => {
    if (!confirm(`Retirer ${username} du groupe ?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/groups/${conversation.id}/members/${userId}`);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du retrait.');
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: 'admin' | 'member') => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setBusy(true);
    setError('');
    try {
      await api.put(`/groups/${conversation.id}/members/${userId}/role`, { role: newRole });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du changement de rôle.');
    } finally {
      setBusy(false);
    }
  };

  const leaveGroup = async () => {
    if (!user || !confirm('Quitter ce groupe ?')) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/groups/${conversation.id}/members/${user.id}`);
      onLeft();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sortie du groupe.');
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Infos du groupe</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Photo du groupe */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            className="avatar"
            style={{
              width: 84, height: 84, margin: '0 auto 8px', fontSize: '1.8rem', position: 'relative',
              background: conversation.avatarUrl ? undefined : avatarColorFor(conversation.name),
              color: '#fff', cursor: isAdmin ? 'pointer' : 'default',
            }}
            onClick={() => isAdmin && fileInputRef.current?.click()}
          >
            {conversation.avatarUrl ? (
              <img src={resolveFileUrl(conversation.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              conversation.name?.[0]?.toUpperCase()
            )}
            {isAdmin && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', borderRadius: 999, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-elevated)' }}>
                <Camera size={13} color="#fff" />
              </div>
            )}
          </div>
          {isAdmin && (
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)} />
          )}

          {/* Nom du groupe */}
          {editingName ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
              <input className="field" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} style={{ maxWidth: 220 }} />
              <button className="btn btn-primary btn-icon" onClick={saveName} disabled={busy}><Check size={16} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{conversation.name}</h3>
              {isAdmin && (
                <button className="btn btn-ghost btn-icon" onClick={() => { setNameDraft(conversation.name); setEditingName(true); }}>
                  <Pencil size={14} />
                </button>
              )}
            </div>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
            {conversation.members.length} membre{conversation.members.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Ajouter des membres */}
        {isAdmin && (
          <div style={{ marginBottom: 14 }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowAddMembers((v) => !v)}>
              <UserPlus size={16} /> Ajouter des membres
            </button>
            {showAddMembers && (
              <div style={{ marginTop: 10, maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                {addableFriends.length === 0 && (
                  <p style={{ padding: 14, fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Tous vos amis sont déjà dans ce groupe.
                  </p>
                )}
                {addableFriends.map((f) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div className="avatar" style={{ width: 30, height: 30, background: f.avatarUrl ? undefined : avatarColorFor(f.username), color: '#fff' }}>
                      {f.avatarUrl ? <img src={resolveFileUrl(f.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} /> : f.username[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: '0.86rem' }}>{f.username}</span>
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => addMember(f.id)} disabled={busy}>
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Liste des membres */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Membres
          </div>
          {conversation.members.map((m) => {
            const role = conversation.memberRoles[m.id];
            const isMe = m.id === user?.id;
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar" style={{ width: 36, height: 36, background: m.avatarUrl ? undefined : avatarColorFor(m.username), color: '#fff' }}>
                  {m.avatarUrl ? <img src={resolveFileUrl(m.avatarUrl)} alt="" style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} /> : m.username[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{m.username}{isMe && ' (vous)'}</div>
                  {role === 'admin' && <div style={{ fontSize: '0.72rem', color: 'var(--accent-strong)' }}>Administrateur</div>}
                </div>
                {isAdmin && !isMe && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      title={role === 'admin' ? 'Rétrograder' : 'Promouvoir administrateur'}
                      onClick={() => toggleRole(m.id, role)}
                      disabled={busy}
                    >
                      {role === 'admin' ? <Shield size={15} /> : <ShieldCheck size={15} />}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Retirer du groupe"
                      onClick={() => removeMember(m.id, m.username)}
                      disabled={busy}
                      style={{ color: 'var(--danger)' }}
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-danger" style={{ width: '100%' }} onClick={leaveGroup} disabled={busy}>
          <LogOut size={16} /> Quitter le groupe
        </button>
      </div>
    </div>
  );
}
