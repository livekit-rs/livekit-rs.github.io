# Start with livekit-rs

Build a local server, then make a first call between two browser tabs. You can follow these steps with no LiveKit account or previous LiveKit experience.

## What you will use

A **room** is where people meet. A **participant** joins the room with a unique identity. A **track** carries one microphone, camera, or screen stream. The server forwards published tracks to participants that subscribe to them.

| Tool | What it does |
| --- | --- |
| `livekit-server` | Runs the Rust server on your computer. |
| `lk` | Creates rooms, lists participants and generates local test tokens. |
| Client SDK | Connects an app to a room and sends or receives media. |
| Server SDK | Signs room tokens and calls management APIs from your backend. |

## Build and run locally

Install [Git](https://git-scm.com/install), [Rust through rustup](https://rustup.rs/), and your system's C linker (Xcode Command Line Tools on macOS or your Linux distribution's build tools). Run these commands in a terminal:

```sh
git clone https://github.com/livekit-rs/livekit-rs.git
cd livekit-rs
cargo build --locked --release -p livecloud --bin livekit-server
./target/release/livekit-server --dev --bind 127.0.0.1
```

The repository selects the required Rust toolchain. The first build downloads dependencies and may take a few minutes. Leave the server running. In a second terminal, check the HTTP endpoint:

```sh
curl --fail http://127.0.0.1:7880/
```

Expect `OK`. If a port is already in use, stop the other service or launch this server with `--port 17880 --rtc.tcp_port 17881 --udp-port 17882` added to the startup command. Use the new HTTP and WebSocket port in the remaining steps.

Development mode uses the public test credentials `devkey` and `secret`. Use them only for this local exercise.

## Connect with a LiveKit SDK

1. Follow the [CLI guide](cli.en.md) to install `lk`, create a room called `demo`, and issue separate tokens for Alice and Bob.
2. Follow the [SDK guide](sdk.en.md) to open the same room in two browser tabs, publish from one, and watch the other receive video.
3. When finished, leave both tabs and stop the server with Ctrl+C. The SDK guide also shows how a Node.js backend can issue tokens and list rooms.

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
