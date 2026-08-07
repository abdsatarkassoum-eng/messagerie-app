import React, { useState, FormEvent } from "react";
import Logo from "./Logo";
import { GoogleIcon, AppleIcon } from "./SocialIcons";
import api from "../services/api"; // ⚠️ adapte le chemin si Login.tsx n'est pas dans src/pages/
import "./auth.css";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function goToSignup(e: React.MouseEvent) {
    e.preventDefault();
    window.location.href = "/register"; // adapte si ta route d'inscription a un autre chemin
  }

  function handleUnavailable(feature: string) {
    setError(`${feature} n'est pas encore disponible — la route backend n'existe pas encore.`);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Merci de renseigner ton e-mail et ton mot de passe.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      // Adapte le nom du champ ci-dessous si ton backend renvoie autre chose que "token"
      const token = res.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      window.location.href = "/chat"; // adapte à ta vraie route d'accueil
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Connexion impossible. Vérifie tes identifiants.";
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

        <div className="auth-title">Bon retour 👋</div>
        <p className="auth-subtitle">
          Connecte-toi pour retrouver tes conversations.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-row">
              <label className="auth-label" htmlFor="login-password">
                Mot de passe
              </label>
              <button
                type="button"
                className="auth-forgot-link"
                onClick={() => handleUnavailable("La réinitialisation du mot de passe")}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="auth-divider">ou continuer avec</div>

        <div className="auth-social-row">
          <button
            type="button"
            className="auth-social-btn"
            onClick={() => handleUnavailable("La connexion avec Google")}
          >
            <GoogleIcon /> Google
          </button>
          <button
            type="button"
            className="auth-social-btn"
            onClick={() => handleUnavailable("La connexion avec Apple")}
          >
            <AppleIcon /> Apple
          </button>
        </div>

        <div className="auth-footer">
          Pas encore de compte ? L'accès se fait sur invitation.{" "}
          <a href="/register" onClick={goToSignup}>
            J'ai un lien d'inscription
          </a>
        </div>
      </div>
    </div>
  );
}
