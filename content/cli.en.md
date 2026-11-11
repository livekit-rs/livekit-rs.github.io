# Use the LiveKit CLI

The official LiveKit CLI executable is called `lk`. It can create rooms, inspect participants and issue access tokens for your local livekit-rs server. The Rust server executable is called `livekit-server` and controls the server process and its configuration.

## Install and connect

Install the [official LiveKit CLI](https://docs.livekit.io/reference/developer-tools/livekit-cli/). On macOS with Homebrew, run:

```sh
brew install livekit-cli
lk --version
```

Start your Rust server with the [quickstart](guides-build-locally.en.md). In a second terminal, direct the CLI to it using the local development credentials. The API uses an HTTP URL. Browsers use a WebSocket URL when they join the room.

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room list
```

An empty room list is normal on a fresh server. Run the exports again in any new terminal that needs these settings. For a deployed server, use its HTTPS API URL and its own credentials.

## Create a room and inspect participants

```sh
lk room create --empty-timeout 600 demo
lk room list
lk room participants list demo
```

The room appears in the room list. The participant list is empty until someone joins. If the room has expired, create it again. After joining with the [browser SDK example](sdk.en.md), repeat the last command to see the connected identities.

## Create a token for each participant

```sh
lk token create --join --room demo --identity alice --valid-for 10m
lk token create --join --room demo --identity bob --valid-for 10m
```

Copy the JWT after `Access token:` in each command's output. Use both tokens with the same room name and separate browser tabs. A token grants its own identity access to the named room. Generate a new token if it expires, and keep tokens and API secrets out of logs and source control.

## Clean up and find more commands

```sh
lk room delete demo
lk room --help
lk token create --help
./target/release/livekit-server --help
```

Deleting the room disconnects its participants. If the demo room has already closed, there is nothing to delete. See the [CLI command reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/rooms/) for more room and participant operations. Check the [compatibility notes](compatibility.en.md) for the server behaviors covered by published tests.
