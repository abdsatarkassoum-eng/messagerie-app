import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

type Step = 'loading' | 'invalid' | 'form';

export default function RequestInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await api.post(`/invitations/${token}/request`, { fullName, email, message });
      const url = new URL(res.data.registrationLink);
      navigate(`${url.pathname}${url.search}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande.');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="auth-logo" />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-strong)', marginBottom: 10 }}>
          FriEnds
        </div>

        {step === 'loading' && <p>Vérification de l'invitation…</p>}

        {step === 'invalid' && (
          <>
            <h1 style={{ fontSize: '1.4rem' }}>Invitation invalide</h1>
            <p style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
          </>
        )}

        {step === 'form' && (
          <form onSubmit={submit}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Rejoindre FriEnds</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 20 }}>
              Renseignez vos informations pour créer votre compte.
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

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Envoi…' : 'Continuer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
