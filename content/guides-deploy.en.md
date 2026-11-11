# Deploy a single node

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
