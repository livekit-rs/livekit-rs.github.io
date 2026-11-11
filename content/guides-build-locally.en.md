# Build and run locally

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
