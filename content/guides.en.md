# User guides

Build, connect, and operate a single livekit-rs node.

## Build and run locally

Install Rust with rustup. Run these commands at the source root. The toolchain file selects Rust 1.99.0 and the lockfile pins build dependencies.

```sh
cargo build --locked --release -p livecloud --bin livekit-server
./target/release/livekit-server --dev --bind 127.0.0.1
```

In a second terminal, check readiness and create an access token. Use a different identity for each participant.

```sh
curl --fail http://127.0.0.1:7880/
./target/release/livekit-server --dev create-join-token --room demo --identity alice
```

Development mode uses the public test credentials `devkey` and `secret` when keys are absent. Use the development token only on a local instance.

## Connect with a LiveKit SDK

Configure your client with `ws://127.0.0.1:7880` for local testing or your HTTPS-protected `wss://` endpoint for deployment. Issue room tokens on a trusted backend. Grant only the needed permissions and keep the API secret on the backend. The Node.js example signs a short-lived token for one room. Your backend should derive the room and identity from the authenticated request.

```ts
import { AccessToken } from 'livekit-server-sdk';

const key = process.env.LIVEKIT_API_KEY;
const secret = process.env.LIVEKIT_API_SECRET;
if (!key || !secret) throw new Error('Missing LiveKit credentials');

const token = new AccessToken(key, secret, { identity: 'alice', ttl: '10m' });
token.addGrant({ roomJoin: true, room: 'demo', canPublish: true, canSubscribe: true });
const jwt = await token.toJwt();
```

Return the token to your client and attach subscribed tracks.

```ts
import { Room, RoomEvent } from 'livekit-client';

const room = new Room({ adaptiveStream: true, dynacast: true });
room.on(RoomEvent.TrackSubscribed, (track) => {
  document.body.append(track.attach());
});
await room.connect(serverUrl, jwt);
await room.localParticipant.enableCameraAndMicrophone();
```

Camera and microphone access require browser permission and a secure context. Test with two identities to confirm publication and subscription in both directions. SDK compatibility depends on the exact workflow. See the [comparison](compatibility.en.md) before migrating.

## Deploy a single node

Copy the [standalone template](../examples/standalone.yaml) to `/etc/livekit/config.yaml`. Install the executable at `/usr/local/bin/livekit-server` and generate deployment credentials.

```sh
/usr/local/bin/livekit-server generate-keys
/usr/local/bin/livekit-server --config /etc/livekit/config.yaml ports
/usr/local/bin/livekit-server --config /etc/livekit/config.yaml
```

Before starting the server, put the generated key and secret in `/etc/livekit/keys.yaml` as a YAML mapping from API key to secret. Set file permissions to `0600` and make the file readable by the dedicated service account. Keep both files and credentials out of application bundles.

The sample binds HTTP and WebSocket to loopback. Terminate HTTPS and WSS on a same-host reverse proxy with WebSocket upgrades enabled. Keep media and TURN ports reachable directly. For native TLS, configure the certificate chain and private key using the [HTTPS/WSS reference](../examples/native-tls.md).

| Port in the template | Protocol and purpose |
| --- | --- |
| 7880 | TCP for HTTP, WebSocket, and Server API. Loopback behind the proxy. |
| 7881 | TCP for ICE fallback. |
| 7882 | UDP for multiplexed WebRTC media. |
| 3478 | UDP for embedded TURN. |
| 30000–30100 | UDP for TURN relay allocations. |

Behind NAT, advertise a real externally reachable address with `rtc.node_ip` and forward the relevant ports. Use `rtc.use_external_ip` only after validating STUN discovery and candidate reachability. Run a real SDK call from outside the server network. The `ports` command reports configuration and cannot establish reachability by itself.

For systemd, start from the [unit template](../examples/livecloud.service). Adjust `ExecStart` to match the installed binary and create the service account before starting the unit. Allow the server to drain during shutdown. A process restart requires clients to re-establish in-memory sessions.

## CLI and configuration

```sh
livekit-server --help
livekit-server help-verbose
livekit-server --version
livekit-server --config /etc/livekit/config.yaml ports
```

The root command accepts LiveKit-style YAML, flags, and environment variables. A nonempty `--config-body` or `LIVEKIT_CONFIG` takes precedence over a file. Inspect `help-verbose` for field-level flags and test the exact configuration before deploying. Generated flag behavior differs between the root command and some subcommands.

## Check a migration

Keep your existing client and backend SDK versions fixed while comparing servers. Test room creation, access-token grants, publish and subscribe, data messages, reconnects, and any Server APIs or webhooks your application uses. Compare your production network path as well as loopback. Retain your previous binary and configuration for rollback. Move traffic only after your required scenarios pass on the candidate.

## Troubleshoot a call

- **Connection refused** — confirm the process is running, the HTTP listener is reachable through your proxy, and the WebSocket upgrade succeeds.
- **Authorization failure** — check the API key, token expiration, room grant, identity, and machine clock.
- **Connected with no media** — confirm browser permissions, selected ICE candidate pairs, public UDP reachability, and TURN routing from the client network.
- **Intermittent stalls** — collect client WebRTC stats and server logs with synchronized timestamps. Record codec, selected transport, RTT, loss, and reconnect events.
- **Configuration fails at startup** — start from the supplied standalone template and add options one at a time. Validate the flags on your exact build.
