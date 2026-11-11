import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const [action, value] = process.argv.slice(2);
const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error('Set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET');
}

const room = 'demo';
switch (action) {
  case 'list': {
    const service = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    console.log((await service.listRooms()).map(({ name }) => name).join('\n'));
    break;
  }
  case 'token': {
    if (!value) throw new Error('Provide a participant identity');
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: value, ttl: '10m' });
    token.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
    console.log(await token.toJwt());
    break;
  }
  default:
    throw new Error('Usage: node server-sdk.mjs list | token IDENTITY');
}
