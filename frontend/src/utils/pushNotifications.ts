import api from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Active les notifications de l'appareil (demande la permission si besoin,
// puis enregistre l'abonnement auprès du serveur). Ne fait rien si déjà fait
// ou si le navigateur ne supporte pas les notifications push.
export async function setupPushNotifications() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await api.post('/push/subscribe', existing.toJSON());
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const keyRes = await api.get('/push/vapid-public-key');
    if (!keyRes.data.publicKey) return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyRes.data.publicKey) as BufferSource,
    });

    await api.post('/push/subscribe', subscription.toJSON());
  } catch {
    // Silencieux : les notifications sont un bonus, ne doivent jamais casser l'app
  }
}
