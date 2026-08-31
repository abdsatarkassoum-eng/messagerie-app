const { AccessToken } = require('livekit-server-sdk');
const jwt = require('jsonwebtoken');

async function generateLiveKitToken({ identity, name, room, canPublish }) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
  });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: !!canPublish,
    canPublishData: !!canPublish,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  // Log temporaire pour vérifier ce qui est réellement encodé dans le jeton
  const decoded = jwt.decode(token);
  console.log('[LIVEKIT] Grant réel encodé pour', identity, '=', JSON.stringify(decoded?.video));

  return token;
}

module.exports = { generateLiveKitToken };
