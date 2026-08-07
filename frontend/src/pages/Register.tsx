import React, { useState, FormEvent } from "react";
import Logo from "./Logo";
import { GoogleIcon, AppleIcon } from "./SocialIcons";
import { supabase } from "../lib/supabaseClient"; // ⚠️ adapte le chemin si ton client Supabase est ailleurs
import "./auth.css";

export default function SignupPage() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

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

      // 1) Crée le compte Supabase avec le username en métadonnée
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (signUpError) throw signUpError;

      // 2) Upload optionnel de l'avatar dans un bucket "avatars"
      //    (crée ce bucket dans Supabase Storage si tu veux utiliser cette partie)
      if (avatarFile && data.user) {
        const filePath = `${data.user.id}/${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError) {
          // On n'empêche pas la création du compte si l'upload échoue
          console.warn("Échec de l'upload de l'avatar :", uploadError.message);
        }
      }

      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de créer le compte pour le moment.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/chat" },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function handleAppleSignup() {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin + "/chat" },
    });
    if (oauthError) setError(oauthError.message);
  }

  function goToLogin(e: React.MouseEvent) {
    e.preventDefault();
    window.location.href = "/login"; // adapte si ta route de connexion a un autre chemin
  }

  if (success) {
    return (
      <div className="auth-screen">
        <div className="auth-blob auth-blob--1" />
        <div className="auth-blob auth-blob--2" />
        <div className="auth-card">
          <Logo />
          <div className="auth-brand">FriEnds</div>
          <div className="auth-title">Compte créé 🎉</div>
          <p className="auth-subtitle">
            Vérifie ta boîte mail ({email}) pour confirmer ton adresse avant
            de te connecter.
          </p>
          <a href="/login" onClick={goToLogin} className="auth-submit"
             style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            Retour à la connexion
          </a>
        </div>
      </div>
    );
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
          <button type="button" className="auth-social-btn" onClick={handleGoogleSignup}>
            <GoogleIcon /> Google
          </button>
          <button type="button" className="auth-social-btn" onClick={handleAppleSignup}>
            <AppleIcon /> Apple
          </button>
        </div>

        <div className="auth-footer">
          Déjà inscrit ? <a href="/login" onClick={goToLogin}>Se connecter</a>
        </div>
      </div>
    </div>
  );
}
