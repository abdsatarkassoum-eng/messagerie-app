import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo" />
<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-strong)', marginBottom: 10 }}>
  FriEnds
</div>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 4px' }}>Bon retour</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 24 }}>
          Connectez-vous pour retrouver vos conversations.
        </p>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <label className="field-label" htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          className="field"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label className="field-label" htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          className="field"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 20 }}
        />

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p style={{ marginTop: 20, fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Pas encore de compte ? L'accès se fait sur invitation.{' '}
          <Link to="/register" style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>
            J'ai un lien d'inscription
          </Link>
        </p>
      </form>
    </div>
  );
}
