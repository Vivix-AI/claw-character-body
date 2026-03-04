const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function sendMessage(text, sessionId) {
  const res = await fetch(`${API_BASE}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, sessionId }) });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function getMessages(sessionId, limit = 50) {
  const res = await fetch(`${API_BASE}/api/messages/${sessionId}?limit=${limit}`);
  if (!res.ok) throw new Error(`Get messages failed: ${res.status}`);
  return res.json();
}

export async function getCharacters() {
  const res = await fetch(`${API_BASE}/api/characters`);
  if (!res.ok) throw new Error(`Get characters failed: ${res.status}`);
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  return res.json();
}
