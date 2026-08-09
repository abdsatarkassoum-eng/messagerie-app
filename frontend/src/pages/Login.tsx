import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthMark from "./AuthMark";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithToken } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        const container = document.getElementById("google-signin-btn");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: 320,
            text: "signin_with",
          });
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleResponse(response: { credential: string }) {
    setError("");
    try {
      setLoading(true);
      const res = await api.post("/auth/google", { credential: response.credential });
      loginWithToken(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Connexion avec Google impossible.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function goToSignup(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/register");
  }

  function goToForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/forgot-password");
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
      await login(email, password);
      navigate("/");
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
        <AuthMark />

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
              <a href="/forgot-password" className="auth-forgot-link" onClick={goToForgotPassword}>
                Mot de passe oublié ?
              </a>
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

        <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center" }} />

        <div className="auth-footer">
          Pas encore de compte ?{" "}
          <a href="/register" onClick={goToSignup}>
            Créer un compte
          </a>
        </div>
      </div>
    </div>
  );
}
