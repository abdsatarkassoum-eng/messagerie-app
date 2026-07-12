# Messagerie — Application de messagerie complète 

Application de messagerie moderne inspirée de Messenger et Signal, avec un design original.
Le code vous appartient intégralement : aucune dépendance à un service d'IA, aucune mention
d'outil tiers dans le code ou l'interface.

## Fonctionnalités

- Comptes utilisateurs avec photo de profil, e-mail, mot de passe (JWT + bcrypt) 
- Liste d'amis, demandes d'amis (envoyer / accepter / refuser), recherche d'utilisateurs
- Messagerie privée et groupes (admins / membres)
- Texte, images, vidéos, documents, messages vocaux, émojis
- Statuts en ligne / hors ligne / "écrit…" / "vu"
- Notifications en temps réel (Socket.io)
- Appels audio et vidéo (WebRTC, signalisation via Socket.io)
- Interface responsive, mode clair / sombre
- Système d'adhésion sur invitation avec module de paiement activable/désactivable
  (Stripe / PayPal / Mobile Money — squelette prêt à brancher)

## Architecture

```
messagerie-app/
├── backend/          Node.js + Express + Sequelize (SQLite ou PostgreSQL) + Socket.io
└── frontend/          React + TypeScript + Vite
```

Le backend utilise **SQLite par défaut** (aucune installation de base de données requise pour
tester) et peut basculer vers **PostgreSQL** en changeant une seule variable d'environnement —
utile lors du passage à un hébergement payant avec plus d'utilisateurs.

---

## 1. Installation en local

**La configuration est déjà faite** : les fichiers `backend/.env` et `frontend/.env` sont
présents et pré-remplis (secret JWT généré aléatoirement, compte admin, base SQLite locale,
proxy frontend déjà pointé vers le backend). Il ne vous reste qu'à installer les dépendances
et démarrer les deux serveurs.

### Prérequis
- Node.js 18 ou plus récent
- npm

### Backend

```bash
cd backend
npm install
npm run seed:admin   # crée le compte administrateur (identifiants ci-dessous)
npm run dev           # démarre le serveur sur http://localhost:5000
```

**Identifiants administrateur générés automatiquement** (visibles aussi dans `backend/.env`) :
- E-mail : `admin@messagerie.local`
- Mot de passe : `8UgxeORaX66i!A1`

⚠️ Changez ce mot de passe dès votre première connexion (menu Profil → mot de passe), surtout
avant toute mise en ligne publique.

### Frontend

```bash
cd frontend
npm install
npm run dev            # démarre l'interface sur http://localhost:5173
```

Ouvrez http://localhost:5173, connectez-vous avec le compte administrateur ci-dessus.

Le mode "sur invitation" (`INVITE_ONLY`) est réglé sur `false` dans `backend/.env` pour que
vous puissiez tester librement (inscription libre via `/register`). Repassez-le à `true` avant
une mise en ligne publique si vous voulez garder le contrôle des inscriptions via les liens
d'invitation générés depuis la page **Administration des invitations**.

Pour désactiver le mode "sur invitation" pendant les tests, mettez `INVITE_ONLY=false` dans le
`.env` du backend : n'importe qui pourra alors s'inscrire directement via `/register`.

### Lancer les tests backend

```bash
cd backend
npm test
```

---

## 2. Le système d'invitation, pas à pas

1. Un administrateur crée un lien d'invitation (page **Administration des invitations**),
   avec un nombre d'utilisations maximum et une date d'expiration optionnelle.
2. Une personne ouvre `https://votre-site/join/<token>` et soumet une demande (nom, e-mail,
   message).
3. L'administrateur voit la demande et peut :
   - la refuser ;
   - l'approuver directement → un lien d'inscription unique est généré ;
   - l'approuver **en exigeant un paiement** (si le module de paiement est activé) → le lien
     d'inscription n'est généré qu'après confirmation du paiement.
4. La personne reçoit son lien d'inscription (`/register?token=...`) et finalise son compte.

### Activer / désactiver le paiement

Dans `backend/.env` :

```
PAYMENT_ENABLED=true       # ou false pour désactiver complètement le module
PAYMENT_PROVIDER=stripe    # stripe | paypal | mobilemoney
STRIPE_SECRET_KEY=...
```

Le fichier `backend/src/controllers/payment.controller.js` contient un squelette prêt à être
complété avec vos identifiants Stripe, PayPal, ou un agrégateur Mobile Money (Kkiapay, Fedapay,
CinetPay...). Tant que `PAYMENT_ENABLED=false`, ce module est totalement ignoré.

---

## 3. Déploiement gratuit permanent depuis un smartphone (sans ordinateur)

Ce parcours ne demande qu'un navigateur Android. Il faut créer 4 comptes gratuits — c'est la
seule chose que personne d'autre que vous ne peut faire à votre place, car ils sont liés à votre
identité (e-mail) : **GitHub**, **Supabase**, **Render**, **Cloudflare**. Utilisez "Se connecter
avec Google" partout où c'est proposé pour aller vite. Une fois ces comptes créés, tout le reste
est déjà préconfiguré dans le projet (fichier `render.yaml` inclus) : vous n'aurez qu'à copier-
coller quelques valeurs.

### Étape A — Mettre le code sur GitHub via Replit

1. Sur **replit.com**, connectez-vous (avec Google).
2. Créez un Repl vide, modèle "Node.js".
3. Dans l'explorateur de fichiers (icône ⋮ → *Upload file*), importez `messagerie-app.zip`.
4. Ouvrez le **Shell** en bas de l'écran et collez :
   ```
   unzip messagerie-app.zip -d tmp && rm messagerie-app.zip
   shopt -s dotglob && mv tmp/messagerie-app/* . && rm -rf tmp
   ```
5. Panneau **Git** (icône branche, colonne de gauche) → *Create a Git repo* → *Connect to
   GitHub* → *Create GitHub repository*. Le code est poussé automatiquement sur un nouveau
   dépôt GitHub — aucune commande git à taper.

### Étape B — Créer la base de données (Supabase, gratuit)

1. Sur **supabase.com**, créez un projet gratuit (choisissez un mot de passe de base de
   données et notez-le).
2. *Project Settings → Database → Connection info* : notez l'hôte, le port (5432), le nom de
   la base, l'utilisateur, le mot de passe.

### Étape C — Déployer le backend (Render, gratuit)

1. Sur **render.com**, connectez GitHub.
2. *New +* → **Blueprint** → sélectionnez le dépôt créé à l'étape A. Render lit automatiquement
   `render.yaml` et prépare le service (nom, build, commandes déjà configurés).
3. Il ne reste que quelques champs à remplir (ceux marqués "à saisir") :
   - `CLIENT_URL` : mettez temporairement `http://localhost:5173` (corrigé à l'étape E)
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` : les valeurs Supabase de l'étape B
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` : vos identifiants administrateur
4. Déployez et notez l'URL donnée par Render (ex. `https://messagerie-backend.onrender.com`).
5. Une fois en ligne, onglet **Shell** du service Render → tapez :
   ```
   npm run seed:admin
   ```
   pour créer le compte administrateur dans la base Supabase.

### Étape D — Déployer le frontend (Cloudflare Pages, gratuit)

1. Sur **pages.cloudflare.com**, connectez GitHub, sélectionnez le même dépôt.
2. Répertoire racine : `frontend` · Build command : `npm run build` · Dossier de sortie : `dist`.
3. Variables d'environnement :
   - `VITE_API_URL` = `https://messagerie-backend.onrender.com/api` (URL de l'étape C)
   - `VITE_SOCKET_URL` = `https://messagerie-backend.onrender.com`
4. Déployez. Vous obtenez une URL du type `https://messagerie-xxx.pages.dev`.

### Étape E — Dernier réglage

Retournez sur Render → variable `CLIENT_URL` → remplacez par l'URL Cloudflare Pages de l'étape D
→ *Manual Deploy* pour redémarrer. C'est terminé : votre application est en ligne en permanence,
accessible depuis n'importe quel téléphone à l'URL Cloudflare Pages.

**Limite connue** : les fichiers envoyés dans les messages (photos, vidéos, documents) sont
stockés sur le disque de Render, qui n'est pas garanti permanent sur l'offre gratuite. Si cela
devient gênant, dites-le-moi : je peux brancher un stockage externe gratuit (Cloudflare R2).

### Passage à un hébergement payant

Quand le nombre d'utilisateurs augmente : passez Render sur un plan payant (ou Railway/VPS), et
Supabase sur un plan payant si la base grossit. Aucune autre modification de code n'est requise.

---

## 4. Personnalisation de l'interface

Toutes les couleurs, polices et espacements sont centralisés dans
`frontend/src/styles/theme.css` sous forme de variables CSS (`--accent`, `--bg`, etc.), avec un
jeu de valeurs pour le mode clair et un jeu pour le mode sombre (`[data-theme='dark']`). Modifiez
ces variables pour changer entièrement l'identité visuelle sans toucher aux composants.

---

## 5. Structure détaillée

```
backend/
  src/
    config/database.js         Connexion Sequelize (SQLite / PostgreSQL)
    models/                     User, FriendRequest, Friendship, Conversation,
                                 ConversationMember, Message, Invitation, JoinRequest
    middleware/                 auth.js (JWT), upload.js (Multer)
    controllers/                 logique métier par domaine
    routes/                      définition des endpoints REST
    sockets/index.js             présence, frappe, messages, signalisation WebRTC
    utils/                       génération de JWT, création du compte admin
    index.js                     point d'entrée du serveur
  test/                          tests de base (Node.js test runner natif)

frontend/
  src/
    context/                     Auth, Socket, Theme
    services/api.ts               client HTTP (axios)
    pages/                         Login, Register, RequestInvite, Chat, AdminInvitations
    components/                   Sidebar, ChatWindow, MessageBubble, MessageInput,
                                   CallModal, NewGroupModal, ProfileModal
    styles/theme.css               design system (couleurs, typographie, layout)
```

## 6. Notes de sécurité avant mise en production

- Changez `JWT_SECRET` pour une valeur longue et aléatoire.
- Changez le mot de passe administrateur par défaut après la première connexion.
- Servez l'application derrière HTTPS (Render et Cloudflare Pages le font automatiquement).
- Limitez la taille des fichiers uploadés si nécessaire (`backend/src/middleware/upload.js`).
