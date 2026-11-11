# Make a first call with Flutter

## Start livekit-rs and get two tokens

Start livekit-rs in development mode using the [quickstart](guides.en.md). In another terminal with [the official CLI](cli.en.md) installed, run:

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity flutter-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

Copy the JWT after `Access token:` from each command. Use `flutter-alice` in the new app and `browser-bob` in the [browser example](sdk.en.md#make-a-call-in-two-browser-tabs). If a token expires, rerun its command. Both participants must join `demo` with different identities. These credentials are for local development. In your application, [issue tokens on your authenticated backend](sdk.en.md#issue-tokens-and-list-rooms-from-nodejs) and pass only the WebSocket URL and participant token to clients.

## Create a Flutter app

Install the [Flutter SDK](https://docs.flutter.dev/install) 3.38 or newer with Dart 3.10 or newer. Install Chrome for the first run, then create the project and add the SDK:

```sh
flutter doctor
flutter create --platforms=web,android,ios flutter_call
cd flutter_call
flutter pub add livekit_client:2.13.2
```

Download [main.dart](../examples/main.dart) and replace `lib/main.dart` with it. Run the app in Chrome:

```sh
flutter run -d chrome --web-hostname 127.0.0.1 --web-port 8080
```

## Join the room and verify audio and video

1. Leave **Server URL** as `ws://127.0.0.1:7880`, paste the `flutter-alice` token, and click **Join**. Join the same room as Bob in the browser example.
2. Click **Publish camera and microphone** in the Flutter app and grant browser access. Bob should see and hear Alice.
3. Enable Bob's camera and microphone and confirm Flutter renders his video and plays his audio. If the browser blocks playback, click **Play audio** in Flutter and check that the tab is unmuted. Use headphones or take turns publishing if the two tabs share devices.
4. Click **Leave** in both clients and press `q` in the Flutter terminal to quit.

The app registers listeners before connecting. It renders video from `TrackSubscribedEvent` with `VideoTrackRenderer`, removes it on unsubscribe, and leaves audio playback to the SDK.

## Run the same app on Android or iOS

- **Android** — Add `INTERNET`, `CAMERA`, and `RECORD_AUDIO` in `android/app/src/main/AndroidManifest.xml`. Merge the debug cleartext setting from the [Android tutorial](sdk-android.en.md#create-a-kotlin-project) into `android/app/src/debug/AndroidManifest.xml` when testing a local emulator. In the app use `ws://10.0.2.2:7880`. Grant both permissions when the app requests media.
- **iOS** — Add the [iOS permissions and local network keys](sdk-ios.en.md#set-up-a-swiftui-app) to `ios/Runner/Info.plist`. Use the simulator for receive-only checks if there is no camera. For both Android and iOS physical devices, use a reachable `wss://` deployment with matching tokens and a trusted certificate.

Run `flutter devices`, then run `flutter run -d DEVICE_ID` using the ID displayed for your device. Repeat the same two-participant check.

[LiveKit Flutter SDK reference](https://pub.dev/packages/livekit_client)
