import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { ArrowLeft } from 'lucide-react';

const CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
  help: {
    title: 'Centre d\'aide',
    body: (
      <>
        <h4>Comment ajouter un ami ?</h4>
        <p>Utilisez la barre de recherche dans l'onglet Discussions ou Amis, tapez un nom d'utilisateur, puis appuyez sur "Ajouter". La personne devra accepter votre demande.</p>

        <h4>Comment créer un groupe ?</h4>
        <p>Depuis l'onglet Discussions, appuyez sur le bouton "+" en haut à droite, puis choisissez les amis à ajouter au groupe.</p>

        <h4>Comment fonctionne le mode "sur invitation" ?</h4>
        <p>Si ce mode est activé par l'administrateur, l'inscription nécessite un lien d'invitation valide. Sans ce mode, tout le monde peut créer un compte librement.</p>

        <h4>Comment publier un statut ?</h4>
        <p>Dans l'onglet Statuts, appuyez sur "Mon statut" pour ajouter un texte, une photo ou une vidéo (visible 24h par vos amis).</p>

        <h4>Comment ajouter le lien de ma boutique ?</h4>
        <p>Sur votre profil, onglet Catalogue ou Services, ajoutez le lien vers votre boutique ou page externe (Facebook, WhatsApp Business, site web…).</p>

        <h4>J'ai un problème non listé ici</h4>
        <p>Contactez le support à l'adresse indiquée dans la rubrique "À propos".</p>
      </>
    ),
  },
  privacy: {
    title: 'Politique de confidentialité',
    body: (
      <>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <h4>Quelles données sont collectées ?</h4>
        <p>Nous collectons les informations que vous fournissez directement : nom d'utilisateur, adresse e-mail, photo de profil, messages et médias envoyés, ainsi que les métadonnées techniques nécessaires au fonctionnement de l'app (statut en ligne, horodatage des messages).</p>

        <h4>Comment sont utilisées ces données ?</h4>
        <p>Vos données servent uniquement à faire fonctionner l'application : messagerie, statuts, publications, notifications. Nous ne vendons ni ne partageons vos données avec des tiers à des fins publicitaires.</p>

        <h4>Où sont stockées les données ?</h4>
        <p>Vos données sont hébergées sur des serveurs sécurisés (base de données PostgreSQL et stockage de fichiers), protégés par chiffrement des mots de passe et connexions sécurisées (HTTPS).</p>

        <h4>Vos droits</h4>
        <p>Vous pouvez à tout moment modifier ou supprimer vos informations personnelles depuis votre profil. Pour toute demande de suppression complète de compte, contactez le support.</p>

        <h4>Notifications push</h4>
        <p>Si vous activez les notifications, un identifiant technique de votre appareil est stocké pour vous envoyer des alertes de nouveaux messages. Vous pouvez désactiver cela à tout moment dans les réglages de votre navigateur/téléphone.</p>
      </>
    ),
  },
  terms: {
    title: 'Conditions générales d\'utilisation',
    body: (
      <>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <h4>Acceptation des conditions</h4>
        <p>En créant un compte sur FriEnds, vous acceptez les présentes conditions d'utilisation.</p>

        <h4>Âge minimum</h4>
        <p>L'utilisation de FriEnds est réservée aux personnes âgées de 13 ans ou plus.</p>

        <h4>Contenu interdit</h4>
        <p>Il est interdit de publier ou d'envoyer du contenu illégal, haineux, violent, à caractère pornographique, ou portant atteinte aux droits d'autrui. Tout compte ne respectant pas cette règle pourra être suspendu.</p>

        <h4>Responsabilité</h4>
        <p>Vous êtes responsable du contenu que vous publiez et des transactions effectuées via les liens de boutique partagés sur la plateforme. FriEnds n'est pas partie prenante des transactions entre vendeurs et acheteurs.</p>

        <h4>Suspension de compte</h4>
        <p>Nous nous réservons le droit de suspendre ou supprimer tout compte ne respectant pas ces conditions, sans préavis en cas d'abus grave.</p>

        <h4>Modifications</h4>
        <p>Ces conditions peuvent être mises à jour. Les changements importants vous seront signalés dans l'application.</p>
      </>
    ),
  },
  about: {
    title: 'À propos',
    body: (
      <>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 64, height: 64, margin: '0 auto 10px', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #12a389, #f2914a)', color: '#fff',
              fontWeight: 800, fontSize: '1.3rem',
            }}
          >
            Fr
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>FriEnds</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Version 1.0.0</div>
        </div>

        <p>FriEnds est une application de messagerie tout-en-un : discussions, statuts, fil d'actualité, vidéos et boutiques en ligne, pensée pour rester simple et rapide.</p>

        <h4>Nous contacter</h4>
        <p>Pour toute question, suggestion ou signalement, écrivez-nous à :</p>
        <p style={{ fontWeight: 600 }}>contact@friends.app</p>
      </>
    ),
  },
};

export default function InfoPage() {
  const { page } = useParams<{ page: string }>();
  const navigate = useNavigate();
  const entry = page && CONTENT[page] ? CONTENT[page] : null;

  return (
    <div className="app-root">
      <TopNav />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px', overflowY: 'auto', height: 'calc(100dvh - 58px)' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Retour aux réglages
        </button>

        {entry ? (
          <div className="card" style={{ padding: 24, lineHeight: 1.6 }}>
            <h2 style={{ marginTop: 0 }}>{entry.title}</h2>
            {entry.body}
          </div>
        ) : (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            Page introuvable.
          </div>
        )}
      </div>
    </div>
  );
}
