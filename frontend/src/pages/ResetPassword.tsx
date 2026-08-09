import React, { useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthMark from "./AuthMark";
import api from "../services/api";
import "./auth.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  function goToLogin(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/login");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Merci de remplir les deux champs.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setError("Lien invalide.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Lien invalide ou expiré. Merci de refaire une demande.";
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

        <div className="auth-title">Nouveau mot de passe 🔒</div>

        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <p className="auth-subtitle">
            Mot de passe mis à jour ! Redirection vers la connexion...
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-password">
                Nouveau mot de passe
              </label>
              <input
                id="reset-password"
                type="password"
                className="auth-input"
                placeholder="6 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-confirm">
                Confirmer le mot de passe
              </label>
              <input
                id="reset-confirm"
                type="password"
                className="auth-input"
                placeholder="Retape le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Mise à jour..." : "Valider le nouveau mot de passe"}
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
