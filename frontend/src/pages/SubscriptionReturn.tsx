import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function SubscriptionReturn() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');

  useEffect(() => {
    const txnId = localStorage.getItem('pendingVerificationTxnId');
    if (!txnId) {
      setStatus('failed');
      return;
    }
    api
      .get(`/subscriptions/verified/check/${txnId}`)
      .then((res) => {
        if (res.data.confirmed) {
          setUser(res.data.user);
          setStatus('success');
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'))
      .finally(() => localStorage.removeItem('pendingVerificationTxnId'));
  }, []);

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 460, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        {status === 'checking' && (
          <>
            <Loader size={40} color="var(--accent-strong)" style={{ marginBottom: 16 }} />
            <h2>Vérification du paiement…</h2>
            <p style={{ color: 'var(--text-muted)' }}>Un instant, on confirme votre transaction avec FedaPay.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} color="var(--online)" style={{ marginBottom: 16 }} />
            <h2>Paiement confirmé !</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              Votre badge vendeur vérifié est actif pour 30 jours.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/feed')}>Retour à l'accueil</button>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle size={48} color="var(--danger)" style={{ marginBottom: 16 }} />
            <h2>Paiement non confirmé</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              Si vous avez bien payé, patientez un instant et retournez sur votre profil. Sinon, réessayez.
            </p>
            <button className="btn btn-secondary" onClick={() => navigate('/feed')}>Retour à l'accueil</button>
          </>
        )}
      </div>
    </div>
  );
}
