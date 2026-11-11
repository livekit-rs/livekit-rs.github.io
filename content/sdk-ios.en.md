# Make a first call with iOS

## Start livekit-rs and get two tokens

Start livekit-rs in development mode using the [quickstart](guides.en.md). In another terminal with [the official CLI](cli.en.md) installed, run:

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity ios-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

Copy the JWT after `Access token:` from each command. Use `ios-alice` in the new app and `browser-bob` in the [browser example](sdk.en.md#make-a-call-in-two-browser-tabs). If a token expires, rerun its command. Both participants must join `demo` with different identities. These credentials are for local development. In your application, [issue tokens on your authenticated backend](sdk.en.md#issue-tokens-and-list-rooms-from-nodejs) and pass only the WebSocket URL and participant token to clients.

## Set up a SwiftUI app

Use Xcode 16.3 or newer. Create an **iOS → App** project, select **SwiftUI** and **Swift**, and set the deployment target to iOS 17 or later. In **File → Add Package Dependencies**, enter the SDK URL:

```text
https://github.com/livekit/client-sdk-swift.git
```

Select **Exact Version** `2.19.0` and add the **LiveKit** product to the app target. Replace the generated `ContentView.swift` with [ContentView.swift](../examples/ContentView.swift). Leave the generated app entry point in place.

In the app target's **Info** tab, add these values. If the project uses a physical `Info.plist`, add the same keys there.

| Key | Type | Example value |
| --- | --- | --- |
| `NSCameraUsageDescription` | String | Share my camera in the room. |
| `NSMicrophoneUsageDescription` | String | Share my microphone in the room. |
| `NSLocalNetworkUsageDescription` | String | Connect to the development server on my network. |
| `NSAppTransportSecurity` → `NSAllowsLocalNetworking` | Boolean within a dictionary | YES for the local development build |

## Run the app and verify media

1. Build and run on an iOS simulator. Leave **Server URL** as `ws://127.0.0.1:7880` to reach the Mac. Paste `ios-alice` and tap **Join**.
2. Use the browser example as Bob. Publish from Bob and check that his video and audio arrive in the simulator. This verifies subscription even if the simulator has no camera for publication.
3. To verify iPhone publication, run on a physical iPhone and use a reachable `wss://` server with a trusted certificate. Mint fresh tokens for both clients on that deployment, join the same room, tap **Publish camera and microphone** and grant permissions. Bob should see and hear the phone. Publish from Bob and confirm the phone receives his media as well.
4. Tap **Leave** in both apps. If you denied capture permissions, allow them in Settings before trying again.

The sample observes room participants and their subscribed video publications in SwiftUI. `SwiftUIVideoView` renders an available video track, and the SDK plays subscribed audio. The loopback address on a physical iPhone refers to that phone. Use the deployment URL when you test on hardware.

[LiveKit Swift SDK reference](https://github.com/livekit/client-sdk-swift)
