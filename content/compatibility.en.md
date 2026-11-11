# Compatibility

The reference is the official LiveKit Server v1.13.10 Go implementation, source commit `e5655ac20267fa5005dccaf3f0e3bfc3ea688c07`. Full compatibility is the project goal. The results below establish parity only for the cases that passed.

## Published Go and Rust comparison

| Scenario | Official Go | livekit-rs |
| --- | --- | --- |
| Isolated IPv4 NAT, explicit ICE restart, 24-second cut, recovery and port reuse | 4/4 | 3/4 |
| Physical-interface-only, explicit node IP, ICE restart and port reuse | 4/4 | 4/4 |
| Full Standalone acceptance | Reference | Open |
| Same-hardware video stability advantage | Reference | Unmeasured |

In the isolated NAT campaign, passing runs selected external UDP, kept the original session through the explicit ICE restart, and recovered ordered reliable data after the network cut in a new session. All 1,024 tested UDP ports could be rebound while the server was still running. The first Rust single-PC run timed out before joining after the SDK received an answer before applying its local offer. Two Rust reruns passed. The campaign does not establish a server-side root cause.

[Download the dated machine-readable NAT receipt](../evidence/nat-recovery-2026-11-11.json). It includes the tested source identities, binary hashes, individual outcomes, and reruns. This receipt describes an archived campaign. The hashes identify the binaries tested at that time.

## Acceptance scope

- **CLI, YAML, and environment** — the pinned CLI differential passed for its checked-in cases. Review each option used by your deployment.
- **Signaling, Server API, JWT, and webhooks** — supported in scoped workflows. Complete behavior and error-path parity still require acceptance.
- **Media and data** — selected codec, layer, transport, and recovery scenarios have SDK evidence. Public NAT and the full media matrix remain open.
- **Advanced deployments** — Redis topologies and external worker behavior have their own acceptance cases. This site documents single-node deployment.

## Reproduce the CLI comparison

Build the pinned Rust checkout and obtain an official Go v1.13.10 binary separately. The baseline binary runs only in the test environment.

```sh
LIVEKIT_OFFICIAL_BIN=/absolute/path/to/official-v1.13.10/livekit-server \
  cargo test --locked -p lk-config --test official_cli -- --ignored
```

[Download the CLI test receipt](../evidence/cli-differential-2026-11-11.json). The test compares the official process output with the Rust configuration library.

To claim full parity, the same final Rust source must pass all applicable cases using unchanged official SDKs and CLI. Preserve failures, retries, test exits, and source and binary identities.

## Evaluate video stability

Compare the two binaries on identical hardware, operating system, network shaping, codec, resolution, bitrate, and participant load. Measure freeze time, interruption duration, time to first decoded frame, reconnect success, and sustained decode rate. Report distributions and failed runs alongside resource usage. Publish a stability claim only after repeated comparisons support it.
