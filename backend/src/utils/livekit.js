const { AccessToken } = require('livekit-server-sdk');

async function generateLiveKitToken({ identity, name, room, canPublish }) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  console.log('[LIVEKIT] Clé utilisée =', JSON.stringify(apiKey));
  console.log('[LIVEKIT] Longueur du secret =', apiSecret ? apiSecret.length : 'undefined');
  console.log('[LIVEKIT] URL configurée =', JSON.stringify(process.env.LIVEKIT_URL));

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
  });
  at.addGrant({ room, roomJoin: true, canPublish, canSubscribe: true });
  const token = await at.toJwt();
  console.log('[LIVEKIT] Jeton généré, longueur =', token.length);
  return token;
}

module.exports = { generateLiveKitToken };
