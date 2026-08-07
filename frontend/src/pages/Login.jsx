import React, { useState } from "react";
import Logo from "./Logo";
import { GoogleIcon, AppleIcon } from "./SocialIcons";
import "./auth.css";

export default function LoginPage({
  onSubmit,       // (email, password) => Promise|void
  onGoogleLogin,   // () => void
  onAppleLogin,    // () => void
  onSendResetLink, // (email) => Promise|void
  onGoToSignup,    // () => void
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Merci de renseigner ton e-mail et ton mot de passe.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit?.(email, password);
    } catch (err) {
      setError(err?.message || "Connexion impossible. Vérifie tes identifiants.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReset() {
    if (!resetEmail) return;
    try {
      setResetLoading(true);
      await onSendResetLink?.(resetEmail);
      setResetSent(true);
    } catch (err) {
      // on affiche quand même un message neutre pour ne pas divulguer si l'email existe
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  }

  function closeForgot() {
    setShowForgot(false);
    setResetSent(false);
    setResetEmail("");
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
                onClick={() => setShowForgot(true)}
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
          <button type="button" className="auth-social-btn" onClick={onGoogleLogin}>
            <GoogleIcon /> Google
          </button>
          <button type="button" className="auth-social-btn" onClick={onAppleLogin}>
            <AppleIcon /> Apple
          </button>
        </div>

        <div className="auth-footer">
          Pas encore de compte ? L'accès se fait sur invitation.{" "}
          <a href="#" onClick={onGoToSignup}>
            J'ai un lien d'inscription
          </a>
        </div>
      </div>

      {showForgot && (
        <div className="auth-modal-backdrop" onClick={closeForgot}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            {!resetSent ? (
              <>
                <h3>Mot de passe oublié</h3>
                <p>
                  Indique ton adresse e-mail, on t'envoie un lien pour
                  choisir un nouveau mot de passe.
                </p>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="vous@exemple.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
                />
                <div className="auth-modal-actions">
                  <button className="auth-modal-cancel" onClick={closeForgot}>
                    Annuler
                  </button>
                  <button
                    className="auth-submit"
                    style={{ marginTop: 0 }}
                    onClick={handleSendReset}
                    disabled={resetLoading || !resetEmail}
                  >
                    {resetLoading ? "Envoi..." : "Envoyer le lien"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>E-mail envoyé ✉️</h3>
                <p>
                  Si un compte existe pour {resetEmail}, un lien de
                  réinitialisation vient d'être envoyé.
                </p>
                <button className="auth-submit" onClick={closeForgot}>
                  Retour à la connexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
