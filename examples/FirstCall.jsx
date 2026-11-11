import { useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

export default function App() {
  const [url, setUrl] = useState('ws://127.0.0.1:7880');
  const [token, setToken] = useState('');
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  if (session) {
    return (
      <LiveKitRoom
        serverUrl={session.url}
        token={session.token}
        connect
        onDisconnected={() => setSession(null)}
        onError={(reason) => {
          setError(reason.message);
          setSession(null);
        }}
        data-lk-theme="default"
        style={{ height: '100dvh' }}
      >
        <VideoConference />
      </LiveKitRoom>
    );
  }

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      setError('');
      setSession({ url: url.trim(), token: token.trim() });
      setToken('');
    }}>
      <h1>First React call</h1>
      <p><label>Server URL <input required value={url} onChange={(e) => setUrl(e.target.value)} /></label></p>
      <p><label>Room token <input required type="password" value={token} onChange={(e) => setToken(e.target.value)} /></label></p>
      <button>Join</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
