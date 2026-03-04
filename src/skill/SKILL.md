---
name: claw-body
description: Give OpenClaw a visual body — connect to 7verse Character API to drive a real-time digital human with video, voice, and emotions. Brain (OpenClaw) + Body (7verse).
metadata:
  openclaw:
    requires:
      bins: [node]
---

# Claw Body — OpenClaw × 7verse

## What
OpenClaw = Brain 🧠 | 7verse Character = Body 🤖

## Quick Start
```bash
cp .env.example .env  # fill in keys
cd src/bridge && npm install && node server.js
cd src/web && npm install && npm run dev
# Open http://localhost:3002
```

## Agent Commands
```bash
# Send message through body
curl -X POST http://localhost:3001/api/chat -H 'Content-Type: application/json' -d '{"text":"hello","sessionId":"default"}'

# Proactive message
curl -X POST http://localhost:3001/api/proactive -H 'Content-Type: application/json' -d '{"text":"I found something interesting!","sessionId":"default"}'

# Health check
curl http://localhost:3001/api/status
```

## API
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat | Send message → reply + audio/video |
| GET | /api/messages/:sid | History |
| POST | /api/proactive | Proactive push |
| GET | /api/characters | List characters |
| GET | /api/status | Health check |

### WebSocket
`ws://localhost:3001/ws?session=xxx&character=yyy`
