import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

type Step = 'loading' | 'invalid' | 'form' | 'submitted';

export default function RequestInvite() {
  const { token } = useParams();
  const [step, setStep] = useState<Step>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await api.get(`/invitations/${token}/check`);
        setStep('form');
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Ce lien d\'invitation est invalide.');
        setStep('invalid');
      }
    };
    check();
  }, [token]);

  useEffect(() => {
    if (!requestId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/invitations/requests/${requestId}/status`);
        setStatus(res.data);
      } catch {
        /* silencieux */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [requestId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post(`/invitations/${token}/request`, { fullName, email, message });
      setRequestId(res.data.requestId);
      setStep('submitted');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande.');
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="auth-logo" />

        {step === 'loading' && <p>Vérification de l'invitation…</p>}

        {step === 'invalid' && (
          <>
            <h1 style={{ fontSize: '1.4rem' }}>Invitation invalide</h1>
            <p style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
          </>
        )}

        {step === 'form' && (
          <form onSubmit={submit}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Demander l'accès</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 20 }}>
              Renseignez vos informations. Un administrateur examinera votre demande.
            </p>

            {errorMsg && (
              <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: '0.88rem' }}>
                {errorMsg}
              </div>
            )}

            <label className="field-label">Nom complet</label>
            <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginBottom: 14 }} />

            <label className="field-label">Adresse e-mail</label>
            <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 14 }} />

            <label className="field-label">Message (optionnel)</label>
            <textarea className="field" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: 20 }} />

            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              Envoyer ma demande
            </button>
          </form>
        )}

        {step === 'submitted' && (
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>Demande envoyée ✅</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Vous recevrez un lien d'inscription dès que votre demande sera approuvée
              {status?.paymentRequired ? ' et le paiement finalisé' : ''}.
            </p>

            {status && (
              <div className="card" style={{ padding: 16, marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Statut : <strong>{translateStatus(status.status)}</strong>
                </p>
                {status.paymentRequired && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
                    Paiement : <strong>{translatePayment(status.paymentStatus)}</strong>
                  </p>
                )}
                {status.registrationLink && (
                  <a className="btn btn-primary" href={status.registrationLink} style={{ marginTop: 12, display: 'inline-flex' }}>
                    Finaliser mon inscription
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function translateStatus(s: string) {
  return { pending: 'en attente', approved: 'approuvée', rejected: 'refusée' }[s] || s;
}
function translatePayment(s: string) {
  return { none: 'non requis', pending: 'en attente', paid: 'payé', failed: 'échoué' }[s] || s;
}
