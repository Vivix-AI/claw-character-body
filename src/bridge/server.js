const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { saveMessage, getMessages, getSessionOrCreate } = require('./db');
const { OpenClawClient } = require('./openclaw-client');
const { SevenVerseClient } = require('./7verse-client');
require('dotenv').config();

const PORT = process.env.BRIDGE_PORT || 3001;
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

const openclaw = new OpenClawClient({
  url: process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3000',
  apiKey: process.env.OPENCLAW_API_KEY || '',
});
const sevenVerse = new SevenVerseClient({
  baseUrl: process.env.SEVENV_API_URL || 'https://api.7verse.ai',
  apiKey: process.env.SEVENV_API_KEY || '',
  characterId: process.env.SEVENV_CHARACTER_ID || '',
});

app.post('/api/chat', async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    const sid = sessionId || uuidv4();
    await getSessionOrCreate(sid);
    await saveMessage(sid, 'user', text);
    const aiReply = await openclaw.chat(text, sid);
    let media = null;
    try { media = await sevenVerse.chatToAction(aiReply.text, aiReply.emotion); } catch (e) { console.warn('[7verse]', e.message); }
    const msg = { id: uuidv4(), role: 'assistant', text: aiReply.text, emotion: aiReply.emotion || 'neutral', audioUrl: media?.audioUrl || null, videoUrl: media?.videoUrl || null, timestamp: Date.now() };
    await saveMessage(sid, 'assistant', msg.text, msg);
    res.json({ sessionId: sid, message: msg });
  } catch (err) { console.error('[POST /api/chat]', err); res.status(500).json({ error: err.message }); }
});

app.get('/api/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, before } = req.query;
    const messages = await getMessages(sessionId, parseInt(limit), before);
    res.json({ sessionId, messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/proactive', async (req, res) => {
  try {
    const { sessionId, text, type = 'proactive' } = req.body;
    const sid = sessionId || 'default';
    let media = null;
    try { media = await sevenVerse.chatToAction(text, 'neutral'); } catch (e) {}
    const msg = { id: uuidv4(), role: 'assistant', text, type, audioUrl: media?.audioUrl || null, videoUrl: media?.videoUrl || null, timestamp: Date.now() };
    await saveMessage(sid, 'assistant', text, msg);
    broadcastToSession(sid, { type: 'proactive', ...msg });
    res.json({ ok: true, message: msg });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/characters', async (req, res) => {
  try { const chars = await sevenVerse.listCharacters(); res.json({ characters: chars }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/status', async (req, res) => {
  const ocStatus = await openclaw.checkStatus();
  const svStatus = await sevenVerse.checkStatus();
  res.json({ bridge: 'ok', openclaw: ocStatus, sevenVerse: svStatus, uptime: process.uptime() });
});

const wss = new WebSocketServer({ server, path: '/ws' });
const wsSessions = new Map();

function broadcastToSession(sessionId, data) {
  const clients = wsSessions.get(sessionId);
  if (!clients) return;
  const payload = JSON.stringify(data);
  clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(payload); });
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get('session') || uuidv4();
  const characterId = url.searchParams.get('character') || process.env.SEVENV_CHARACTER_ID;
  if (!wsSessions.has(sessionId)) wsSessions.set(sessionId, new Set());
  wsSessions.get(sessionId).add(ws);
  console.log(`[WS] connected session=${sessionId}`);

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'chat') {
        await saveMessage(sessionId, 'user', data.text);
        const reply = await openclaw.chat(data.text, sessionId);
        let stream = null;
        try { stream = await sevenVerse.startLiveChat(characterId, reply.text, reply.emotion); } catch (e) {}
        const msg = { type: 'response', id: uuidv4(), text: reply.text, emotion: reply.emotion || 'neutral', stream: stream || null, timestamp: Date.now() };
        await saveMessage(sessionId, 'assistant', reply.text, msg);
        ws.send(JSON.stringify(msg));
      } else if (data.type === 'start_live') {
        const liveSession = await sevenVerse.startLiveSession(characterId);
        ws.send(JSON.stringify({ type: 'live_started', ...liveSession }));
      } else if (data.type === 'stop_live') {
        await sevenVerse.stopLiveSession(data.liveSessionId);
        ws.send(JSON.stringify({ type: 'live_stopped' }));
      } else if (data.type === 'audio') {
        ws.send(JSON.stringify({ type: 'error', message: 'Audio input not yet implemented' }));
      }
    } catch (err) { console.error('[WS]', err); ws.send(JSON.stringify({ type: 'error', message: err.message })); }
  });

  ws.on('close', () => {
    wsSessions.get(sessionId)?.delete(ws);
    if (wsSessions.get(sessionId)?.size === 0) wsSessions.delete(sessionId);
  });
});

server.listen(PORT, () => { console.log(`🤖 Claw Body Bridge → http://localhost:${PORT}`); });
