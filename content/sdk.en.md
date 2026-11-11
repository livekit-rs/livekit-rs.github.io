# Connect an app with LiveKit SDKs

A **client SDK** joins a room, publishes local audio and video, and subscribes to other participants' tracks. A **server SDK** runs on your backend, signs access tokens and calls administrative APIs. The browser only needs the WebSocket URL and a room token.

## Start a platform tutorial

Pick a client and use a second participant to check that media arrives. Each walkthrough includes a complete example to download.

| Platform | Walkthrough |
| --- | --- |
| React | [Build a browser call with React](sdk-react.en.md) |
| Android | [Build a Kotlin Android call](sdk-android.en.md) |
| iOS | [Build a SwiftUI call](sdk-ios.en.md) |
| Flutter | [Build a Flutter call](sdk-flutter.en.md) |

## Make a call in two browser tabs

Start the Rust server with the [quickstart](guides-build-locally.en.md), then create the `demo` room and two tokens by following the [CLI guide](cli.en.md). Each token must use a different identity. Have Node.js with npm, Python 3, and a browser with a camera and microphone available.

Create a working folder and save the [browser example](../examples/first-call.html) into it as `first-call.html`. Run these commands from that folder:

```sh
npm install --save-exact livekit-client@2.23.0
python3 -m http.server 8000 --bind 127.0.0.1
```

1. Open [http://127.0.0.1:8000/first-call.html](http://127.0.0.1:8000/first-call.html) in two tabs on the same computer as the Rust server.
2. Keep `ws://127.0.0.1:7880` in the server field. Paste Alice's token in the first tab and Bob's in the second, then click **Join** in both.
3. In Alice's tab, click **Enable camera and microphone** and grant browser access. Alice sees a local preview. Bob should see Alice's video under **Remote media**. If playback is blocked, click **Play audio** in Bob's tab. Use headphones to avoid feedback.
4. Click **Leave** when finished and stop the local Python server with Ctrl+C.

If the camera is busy, publish from one tab and receive in the other. If the connection fails, check that the Rust server is running, the token is fresh, and both tabs use distinct identities for the same room. To use another device, deploy an HTTPS page and use a reachable `wss://` endpoint. Loopback addresses only work on the machine that runs the service.

## Issue tokens and list rooms from Node.js

Save the [server SDK example](../examples/server-sdk.mjs) as `server-sdk.mjs` in your working folder. With the Rust server still running:

```sh
npm install --save-exact livekit-server-sdk@2.19.3
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
node server-sdk.mjs list
node server-sdk.mjs token alice
```

The first command invoking the script prints room names through the Room Service API. The second prints a ten-minute JWT for Alice in `demo`. It can replace Alice's CLI-generated token after she leaves. Start a fresh token for each identity.

For an application, use an authenticated backend route. Derive the identity from the signed-in user, check that the user can join the requested room, and sign a short-lived token with only the required grants. Return the WebSocket URL and token to the client over HTTPS. Keep the API secret and administrative calls on your backend.

## Choose a client or backend SDK

Use a participant token and a reachable WebSocket URL with each client SDK. Use the HTTP or HTTPS API endpoint with your API key and secret on the backend. The examples above cover the browser and Node.js workflows. For other clients, follow the SDK's setup instructions and verify your application against the [published compatibility results](compatibility.en.md).

| Building | SDK and integration reference |
| --- | --- |
| Web or React | [JavaScript client SDK](https://github.com/livekit/client-sdk-js) · [React components](https://github.com/livekit/components-js) |
| iOS or macOS | [Swift client SDK](https://github.com/livekit/client-sdk-swift) |
| Android | [Android client SDK](https://github.com/livekit/client-sdk-android) |
| Flutter | [Flutter client SDK](https://github.com/livekit/client-sdk-flutter) |
| Node.js backend | [Node.js server SDK](https://github.com/livekit/node-sdks/tree/main/packages/livekit-server-sdk) |
| Python, Go, or another backend | [LiveKit Server API SDKs](https://docs.livekit.io/reference/#server-apis) |
