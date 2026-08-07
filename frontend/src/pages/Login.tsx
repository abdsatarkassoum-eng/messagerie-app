import React, { useState, FormEvent } from "react";
import Logo from "./Logo";
import { GoogleIcon, AppleIcon } from "./SocialIcons";
import { supabase } from "../lib/supabaseClient"; // ⚠️ adapte le chemin si ton client Supabase est ailleurs
import "./auth.css";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [showForgot, setShowForgot] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>("");
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Merci de renseigner ton e-mail et ton mot de passe.");
      return;
    }
    try {
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // Connexion réussie → redirige vers l'app.
      // Remplace "/chat" par ta vraie route d'accueil si besoin.
      window.location.href = "/chat";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Connexion impossible. Vérifie tes identifiants.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/chat" },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function handleAppleLogin() {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin + "/chat" },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function handleSendReset() {
    if (!resetEmail) return;
    setResetError("");
    try {
      setResetLoading(true);
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        { redirectTo: window.location.origin + "/reset-password" }
      );
      if (resetErr) throw resetErr;
      setResetSent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'envoyer l'e-mail pour le moment.";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  }

  function closeForgot() {
    setShowForgot(false);
    setResetSent(false);
    setResetEmail("");
    setResetError("");
  }

  function goToSignup(e: React.MouseEvent) {
    e.preventDefault();
    window.location.href = "/register"; // adapte si ta route d'inscription a un autre chemin
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
          <button type="button" className="auth-social-btn" onClick={handleGoogleLogin}>
            <GoogleIcon /> Google
          </button>
          <button type="button" className="auth-social-btn" onClick={handleAppleLogin}>
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
                {resetError && <div className="auth-error">{resetError}</div>}
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
                  réinitialisation vient d'être envoyé. Pense à vérifier
                  tes spams.
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
