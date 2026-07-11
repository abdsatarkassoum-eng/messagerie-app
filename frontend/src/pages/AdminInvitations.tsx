import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Invitation, JoinRequestItem } from '../types';

export default function AdminInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [requirePaymentFor, setRequirePaymentFor] = useState<Record<string, boolean>>({});

  const load = async () => {
    const [invRes, reqRes, payRes] = await Promise.all([
      api.get('/invitations'),
      api.get('/invitations/requests/all'),
      api.get('/payments/config'),
    ]);
    setInvitations(invRes.data.invitations);
    setRequests(reqRes.data.requests);
    setPaymentEnabled(payRes.data.enabled);
  };

  useEffect(() => {
    load();
  }, []);

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/invitations', {
      label: label || undefined,
      maxUses,
      expiresInDays: expiresInDays || undefined,
    });
    setLabel('');
    setMaxUses(1);
    setExpiresInDays('');
    load();
  };

  const review = async (id: string, action: 'approve' | 'reject') => {
    const res = await api.post(`/invitations/requests/${id}/review`, {
      action,
      requirePayment: !!requirePaymentFor[id],
    });
    if (res.data.registrationLink) {
      alert(`Lien d'inscription généré :\n${res.data.registrationLink}`);
    }
    load();
  };

  const confirmPayment = async (id: string) => {
    const res = await api.post('/payments/confirm', { requestId: id, reference: 'CONFIRMATION_MANUELLE' });
    if (res.data.registrationLink) {
      alert(`Paiement confirmé. Lien d'inscription :\n${res.data.registrationLink}`);
    }
    load();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Lien copié dans le presse-papiers.');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="display" style={{ margin: 0 }}>Administration des invitations</h1>
        <Link to="/" className="btn btn-secondary">← Retour à la messagerie</Link>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 28 }}>
        <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Module de paiement : <strong>{paymentEnabled ? 'activé' : 'désactivé'}</strong> (modifiable via la variable
          d'environnement <code>PAYMENT_ENABLED</code> côté serveur).
        </p>

        <h2 style={{ fontSize: '1.05rem' }}>Créer un lien d'invitation</h2>
        <form onSubmit={createInvitation} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="field-label">Libellé (optionnel)</label>
            <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : campagne Instagram" />
          </div>
          <div>
            <label className="field-label">Utilisations max.</label>
            <input type="number" min={1} className="field" style={{ width: 100 }} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label">Expire dans (jours)</label>
            <input type="number" min={1} className="field" style={{ width: 120 }} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : '')} placeholder="Illimité" />
          </div>
          <button type="submit" className="btn btn-primary">Générer le lien</button>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.05rem' }}>Liens d'invitation actifs</h2>
        {invitations.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune invitation créée.</p>}
        {invitations.map((inv) => (
          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{inv.label || 'Sans libellé'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {inv.usesCount}/{inv.maxUses} utilisations · {inv.expiresAt ? `expire le ${new Date(inv.expiresAt).toLocaleDateString('fr-FR')}` : 'sans expiration'}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => copy(inv.inviteLink)}>Copier le lien</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: '1.05rem' }}>Demandes d'adhésion</h2>
        {requests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune demande pour le moment.</p>}
        {requests.map((r) => (
          <div key={r.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.fullName} · {r.email}</div>
                {r.message && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.message}</div>}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Statut : {r.status} {r.paymentRequired && `· Paiement : ${r.paymentStatus}`}
                </div>
              </div>

              {r.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {paymentEnabled && (
                    <label style={{ fontSize: '0.8rem', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!requirePaymentFor[r.id]}
                        onChange={(e) => setRequirePaymentFor((prev) => ({ ...prev, [r.id]: e.target.checked }))}
                      />
                      Exiger un paiement
                    </label>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => review(r.id, 'approve')}>Approuver</button>
                    <button className="btn btn-secondary" onClick={() => review(r.id, 'reject')}>Refuser</button>
                  </div>
                </div>
              )}

              {r.status === 'approved' && r.paymentRequired && r.paymentStatus === 'pending' && (
                <button className="btn btn-primary" onClick={() => confirmPayment(r.id)}>Confirmer le paiement</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
