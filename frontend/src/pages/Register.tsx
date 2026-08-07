import React, { useState, FormEvent } from "react";
import Logo from "./Logo";
import { GoogleIcon, AppleIcon } from "./SocialIcons";
import "./auth.css";

interface SignupFormData {
  username: string;
  email: string;
  password: string;
  avatarFile: File | null;
}

interface SignupPageProps {
  onSubmit?: (data: SignupFormData) => Promise<void> | void;
  onGoogleSignup?: () => void;
  onAppleSignup?: () => void;
  onGoToLogin?: () => void;
}

export default function SignupPage({
  onSubmit,
  onGoogleSignup,
  onAppleSignup,
  onGoToLogin,
}: SignupPageProps) {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) {
      setError("Tous les champs marqués sont requis.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit?.({ username, email, password, avatarFile });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de créer le compte pour le moment.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card">
        <Logo />
        <div className="auth-brand">FriEnds</div>

        <div className="auth-title">Créer ton compte ✨</div>
        <p className="auth-subtitle">
          Un lien d'inscription valide est requis pour créer un compte.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-avatar">
              Photo de profil (optionnel)
            </label>
            <input
              id="signup-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-username">
              Nom d'utilisateur
            </label>
            <input
              id="signup-username"
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-email">
              Adresse e-mail
            </label>
            <input
              id="signup-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-password">
              Mot de passe
            </label>
            <input
              id="signup-password"
              type="password"
              className="auth-input"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <div className="auth-divider">ou continuer avec</div>

        <div className="auth-social-row">
          <button type="button" className="auth-social-btn" onClick={onGoogleSignup}>
            <GoogleIcon /> Google
          </button>
          <button type="button" className="auth-social-btn" onClick={onAppleSignup}>
            <AppleIcon /> Apple
          </button>
        </div>

        <div className="auth-footer">
          Déjà inscrit ? <a href="#" onClick={onGoToLogin}>Se connecter</a>
        </div>
      </div>
    </div>
  );
}
