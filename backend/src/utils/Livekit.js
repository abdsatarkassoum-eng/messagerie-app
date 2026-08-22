const { AccessToken } = require('livekit-server-sdk');

async function generateLiveKitToken({ identity, name, room, canPublish }) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity,
    name,
  });
  at.addGrant({ room, roomJoin: true, canPublish, canSubscribe: true });
  return await at.toJwt();
}

module.exports = { generateLiveKitToken };
