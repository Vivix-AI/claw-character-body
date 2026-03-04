'use client';
import { useState, useEffect } from 'react';
import ChatMode from './components/ChatMode';
import LiveMode from './components/LiveMode';

export default function Home() {
  const [mode, setMode] = useState('chat');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    let sid = localStorage.getItem('claw-session-id');
    if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('claw-session-id', sid); }
    setSessionId(sid);
  }, []);

  if (!sessionId) return <div className="loading">Loading...</div>;

  return (
    <main className="app-container">
      {mode === 'chat' ? (
        <ChatMode sessionId={sessionId} onSwitchToLive={() => setMode('live')} />
      ) : (
        <LiveMode sessionId={sessionId} onSwitchToChat={() => setMode('chat')} />
      )}
    </main>
  );
}
