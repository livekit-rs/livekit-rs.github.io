# Make a first call with React

## Start livekit-rs and get two tokens

Start livekit-rs in development mode using the [quickstart](guides.en.md). In another terminal with [the official CLI](cli.en.md) installed, run:

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity react-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

Copy the JWT after `Access token:` from each command. Use `react-alice` in the new app and `browser-bob` in the [browser example](sdk.en.md#make-a-call-in-two-browser-tabs). If a token expires, rerun its command. Both participants must join `demo` with different identities. These credentials are for local development. In your application, [issue tokens on your authenticated backend](sdk.en.md#issue-tokens-and-list-rooms-from-nodejs) and pass only the WebSocket URL and participant token to clients.

## Install React and the LiveKit components

Use Node.js 24 with npm. Create a JavaScript React project and install the SDK and UI packages:

```sh
npm create vite@9.3.4 react-call -- --template react --no-interactive
cd react-call
npm install
npm install --save-exact livekit-client@2.23.0 @livekit/components-react@2.9.25 @livekit/components-styles@1.2.0
```

Download [FirstCall.jsx](../examples/FirstCall.jsx) and replace the generated `src/App.jsx` with it. Remove the `import './index.css'` line in `src/main.jsx` so the starter CSS does not constrain the conference view. Start the dev server:

```sh
npm run dev -- --host 127.0.0.1
```

## Join, publish and receive

1. Open the Vite URL printed in the terminal, normally `http://127.0.0.1:5173`. Keep `ws://127.0.0.1:7880` as the **Server URL** and paste the `react-alice` token. Click **Join**.
2. Open the browser example in a second tab and join as `browser-bob`.
3. Enable the camera and microphone in the React control bar and allow browser access. Bob should see and hear Alice. Stop Alice's camera if the device cannot serve both tabs. Enable Bob's camera and microphone and verify that Alice sees and hears Bob. Use headphones, or take turns publishing to avoid feedback.
4. Click **Leave** in both apps and stop Vite with Ctrl+C.

`LiveKitRoom` connects and provides room state to its children. `VideoConference` renders subscribed video, plays subscribed audio, and gives you controls to publish local media. If the browser blocks audio playback, use the conference's audio playback prompt. If devices are missing, allow camera and microphone access in the browser and OS. For a deployed web app, serve it over HTTPS and connect to your server's `wss://` address.

[LiveKit React component reference](https://docs.livekit.io/reference/components/react/)
