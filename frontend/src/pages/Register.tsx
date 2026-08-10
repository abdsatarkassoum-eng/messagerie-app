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

export default function SignupPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [username, setUsername] = useState<string>("");
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
            text: "signup_with",
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
      navigate("/feed");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Connexion avec Google impossible.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function goToLogin(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/login");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);

      const res = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const token = res.data?.token;
      if (token) {
        loginWithToken(token, res.data.user);
        navigate("/feed");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Impossible de créer le compte pour le moment.";
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

        <div className="auth-title">Créer ton compte ✨</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
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

        <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center" }} />

        <div className="auth-footer">
          Déjà inscrit ? <a href="/login" onClick={goToLogin}>Se connecter</a>
        </div>
      </div>
    </div>
  );
}
