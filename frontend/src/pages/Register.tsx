import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationToken = searchParams.get('token') || '';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (registrationToken) formData.append('registrationToken', registrationToken);
      if (avatar) formData.append('avatar', avatar);

      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
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
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 4px' }}>Créer votre compte</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 24 }}>
          {registrationToken
            ? 'Votre invitation a été validée. Finalisez votre profil.'
            : "Un lien d'inscription valide est requis pour créer un compte."}
        </p>

        {error && (
          <div style={{ background: 'var(--coral-soft)', color: 'var(--danger)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <label className="field-label">Photo de profil (optionnel)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          style={{ marginBottom: 16 }}
        />

        <label className="field-label" htmlFor="username">Nom d'utilisateur</label>
        <input
          id="username"
          className="field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label className="field-label" htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          className="field"
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
          placeholder="6 caractères minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 20 }}
        />

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        <p style={{ marginTop: 20, fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
