import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import api from "../services/api";
import "./auth.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [sent, setSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  function goToLogin(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/login");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Merci de renseigner ton adresse e-mail.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Une erreur est survenue.";
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

        <div className="auth-title">Mot de passe oublié 🔑</div>
        <p className="auth-subtitle">
          Indique ton e-mail, on t'envoie un lien pour en choisir un nouveau.
        </p>

        {error && <div className="auth-error">{error}</div>}

        {sent ? (
          <p className="auth-subtitle">
            Si un compte existe avec cet e-mail, un lien de réinitialisation
            vient d'être envoyé. Vérifie ta boîte de réception (et tes spams).
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="forgot-email">
                Adresse e-mail
              </label>
              <input
                id="forgot-email"
                type="email"
                className="auth-input"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <a href="/login" onClick={goToLogin}>← Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}
