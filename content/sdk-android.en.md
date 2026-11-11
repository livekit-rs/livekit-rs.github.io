# Make a first call with Android

## Start livekit-rs and get two tokens

Start livekit-rs in development mode using the [quickstart](guides.en.md). In another terminal with [the official CLI](cli.en.md) installed, run:

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity android-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

Copy the JWT after `Access token:` from each command. Use `android-alice` in the new app and `browser-bob` in the [browser example](sdk.en.md#make-a-call-in-two-browser-tabs). If a token expires, rerun its command. Both participants must join `demo` with different identities. These credentials are for local development. In your application, [issue tokens on your authenticated backend](sdk.en.md#issue-tokens-and-list-rooms-from-nodejs) and pass only the WebSocket URL and participant token to clients.

## Create a Kotlin project

In Android Studio, choose **New Project → Empty Views Activity**. Use Kotlin, package name `com.example.livekitcall`, and minimum SDK 24 or higher. Use JDK 17 and set compile and target SDK to 36 for this local example. In the root `settings.gradle.kts`, add JitPack inside the existing `dependencyResolutionManagement { repositories { … } }` block. The SDK uses it for its audio routing dependency.

```kotlin
maven("https://jitpack.io") {
    content { includeGroup("com.github.davidliu") }
}
```

In `app/build.gradle.kts`, add these inside `dependencies`:

```kotlin
implementation("io.livekit:livekit-android:2.30.0")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.4")
```

In the same file, align Java and Kotlin to JVM 17. If the template already sets both targets, update those settings instead of adding duplicates. Then sync Gradle. In `app/src/main/AndroidManifest.xml`, add the permissions as children of `<manifest>`, outside `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

For the local emulator only, create `app/src/debug/AndroidManifest.xml` with the following content so the debug variant can connect over `ws://`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true" />
</manifest>
```

Replace the generated `MainActivity.kt` with [MainActivity.kt](../examples/MainActivity.kt). Keep the package in that file aligned with your app's namespace.

## Run in the emulator and verify media

1. In Device Manager, create an emulator and configure its camera to use a webcam or the virtual scene. Run the debug app. Use `ws://10.0.2.2:7880`, which routes the Android emulator to the host machine. Use the ordinary loopback address in Bob's browser on the host.
2. Paste `android-alice` into **Room token** and tap **Join**. Open the browser example as Bob and publish first. The Android app should render Bob's video and play his audio automatically. In emulator settings, enable microphone input if you also want to test capture.
3. Tap **Publish camera and microphone** in Android, then grant both runtime permissions. Bob should see and hear the Android participant. Use headphones or switch off the browser's capture before publishing from Android if the devices are shared.
4. Tap **Leave** in both apps.

The activity listens for `TrackSubscribed` before connecting. The SDK subscribes automatically, the activity attaches the received video to a `SurfaceViewRenderer`, and remote audio plays through the SDK. Unsubscribing detaches the renderer. For a real phone, use your deployed `wss://` endpoint and mint both tokens using that deployment's credentials. The emulator address only works inside the Android emulator.

[LiveKit Android SDK reference](https://github.com/livekit/client-sdk-android)
