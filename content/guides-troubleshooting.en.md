# Troubleshoot a call

- **Connection refused** — confirm the process is running, the HTTP listener is reachable through your proxy, and the WebSocket upgrade succeeds.
- **Authorization failure** — check the API key, token expiration, room grant, identity, and machine clock.
- **Connected with no media** — confirm browser permissions, selected ICE candidate pairs, public UDP reachability, and TURN routing from the client network.
- **Intermittent stalls** — collect client WebRTC stats and server logs with synchronized timestamps. Record codec, selected transport, RTT, loss, and reconnect events.
- **Configuration fails at startup** — start from the supplied standalone template and add options one at a time. Validate the flags on your exact build.
