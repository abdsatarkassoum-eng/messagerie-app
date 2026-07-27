const webpush = require('web-push');
const { PushSubscription } = require('../models');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contact@friends.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Envoie une notification push à TOUS les appareils d'un utilisateur.
// payload : { title, body, url, icon }
async function sendPushToUser(userId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return; // module non configuré, on ignore silencieusement

  const subscriptions = await PushSubscription.findAll({ where: { userId } });
  if (subscriptions.length === 0) return;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    icon: payload.icon || '/icon-192.png',
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
      } catch (err) {
        // Abonnement expiré ou invalide : on le supprime pour ne pas réessayer indéfiniment
        if (err.statusCode === 404 || err.statusCode === 410) {
          await sub.destroy().catch(() => {});
        }
      }
    })
  );
}

module.exports = { sendPushToUser };
