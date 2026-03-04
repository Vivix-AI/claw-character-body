# AGENTS.md — Claw Character Body

## Project Overview

Claw Character Body gives OpenClaw a **visual body** — a real-time digital human avatar.

- **OpenClaw** = Brain 🧠 (thinking, memory, tools, personality)
- **7verse Character** = Body 🤖 (video, voice, facial expressions, lip sync)
- **Bridge Server** = Nervous System 🔗 (connects brain ↔ body)

## Architecture

```
┌─────────────────────────┐
│    Mobile Web App       │
│   (Next.js / React)     │
│  ┌─────────┬──────────┐ │
│  │  Chat   │   Live   │ │
│  │ Mode A  │  Mode B  │ │
│  └────┬────┴────┬─────┘ │
└───────┼─────────┼───────┘
        │REST     │WebSocket
┌───────▼─────────▼───────┐
│    Bridge Server        │
│  Express + WS + SQLite  │
│                         │
│  ┌──────────────────┐   │
│  │ Message Router   │   │
│  │ Emotion Inferrer │   │
│  │ Session Manager  │   │
│  │ DB Persistence   │   │
│  └──────────────────┘   │
└───┬─────────────────┬───┘
    ▼                 ▼
┌────────┐      ┌──────────┐
│OpenClaw│      │  7verse  │
│Gateway │      │Character │
│        │      │   API    │
│ /api/  │      │          │
│message │      │chat-do-  │
│        │      │ action   │
└────────┘      └──────────┘
```

## Repository Structure

```
src/
├── bridge/                     # Backend — Node.js Bridge Server
│   ├── server.js               # Express + WebSocket main server
│   ├── 7verse-client.js        # 7verse Character API wrapper
│   ├── openclaw-client.js      # OpenClaw Gateway communication
│   ├── db.js                   # SQLite message persistence
│   └── package.json
├── web/                        # Frontend — Next.js Mobile Web App
│   ├── app/
│   │   ├── page.js             # Mode switcher (chat ↔ live)
│   │   ├── layout.js           # Root layout
│   │   ├── globals.css         # Dark theme, mobile-first CSS
│   │   └── components/
│   │       ├── ChatMode.js     # Mode A: iMessage-style async chat
│   │       └── LiveMode.js     # Mode B: Full-screen live interaction
│   ├── lib/
│   │   ├── api.js              # REST API client
│   │   └── ws.js               # WebSocket hook with auto-reconnect
│   └── package.json
└── skill/                      # OpenClaw Skill definition
    ├── SKILL.md                # Skill metadata + usage docs
    └── scripts/
        ├── chat.sh             # CLI: send message
        └── status.sh           # CLI: check health
```

## Dev Environment

### Prerequisites
- Node.js >= 18
- npm or pnpm
- An OpenClaw Gateway instance running (default: `http://localhost:3000`)
- A 7verse Character API key + Character ID

### Setup
```bash
git clone https://github.com/Vivix-AI/claw-character-body.git
cd claw-character-body
cp .env.example .env   # fill in your keys
```

### Running

**Bridge Server** (terminal 1):
```bash
cd src/bridge
npm install
node server.js          # http://localhost:3001
```

**Web App** (terminal 2):
```bash
cd src/web
npm install
npm run dev             # http://localhost:3002
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCLAW_GATEWAY_URL` | Yes | OpenClaw Gateway URL |
| `OPENCLAW_API_KEY` | No | OpenClaw API key (if auth enabled) |
| `SEVENV_API_URL` | Yes | 7verse Character API base URL |
| `SEVENV_API_KEY` | Yes | 7verse API authentication key |
| `SEVENV_CHARACTER_ID` | Yes | Default character to use |
| `BRIDGE_PORT` | No | Bridge server port (default: 3001) |

## Coding Conventions

- **JavaScript/ES Modules** — Node.js backend uses CommonJS (`require`), frontend uses ESM (`import`)
- **No TypeScript yet** — planned for v0.2, current code is plain JS for rapid prototyping
- **Error handling** — all API endpoints wrap in try/catch, WebSocket handlers catch per-message
- **Naming** — camelCase for JS variables/functions, kebab-case for files
- **CSS** — single `globals.css` with CSS custom properties, mobile-first
- **Comments** — explain "why", not "what"; mark TODO items with `// TODO:`

## API Reference

### REST Endpoints (Mode A: Async Chat)
| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/chat` | `{text, sessionId}` | `{sessionId, message}` |
| `GET` | `/api/messages/:sid` | — | `{sessionId, messages[]}` |
| `POST` | `/api/proactive` | `{text, sessionId, type?}` | `{ok, message}` |
| `GET` | `/api/characters` | — | `{characters[]}` |
| `GET` | `/api/status` | — | `{bridge, openclaw, sevenVerse, uptime}` |

### WebSocket (Mode B: Live Interactive)
Connect: `ws://localhost:3001/ws?session=<id>&character=<id>`

| Client sends | Server responds |
|-------------|-----------------|
| `{type:'chat', text}` | `{type:'response', text, emotion, stream}` |
| `{type:'start_live'}` | `{type:'live_started', streamUrl, liveSessionId}` |
| `{type:'stop_live', liveSessionId}` | `{type:'live_stopped'}` |

Server can push anytime: `{type:'proactive', text, stream}`

## Data Flow

### Mode A (Async Chat)
```
User types message
  → POST /api/chat
    → Bridge saves to SQLite
    → Bridge calls OpenClaw Gateway (/api/message)
    → OpenClaw thinks + returns text + emotion
    → Bridge calls 7verse chat-do-action (text → audio/video)
    → Bridge saves response to SQLite
    → Returns {text, emotion, audioUrl, videoUrl}
```

### Mode B (Live Interactive)
```
User connects WebSocket
  → Bridge opens session
  → User sends {type:'start_live'}
    → Bridge calls 7verse startLiveSession → returns streamUrl
    → Frontend renders video stream
  → User sends {type:'chat', text}
    → Bridge → OpenClaw → 7verse live/chat
    → Real-time video response streamed to frontend
```

## Key Design Decisions

1. **Bridge pattern** — Bridge Server sits between frontend and both APIs, keeping API keys server-side and enabling message persistence
2. **Dual mode** — Mode A for passive/async usage, Mode B for immersive real-time interaction
3. **Emotion inference** — Simple regex-based emotion detection from OpenClaw's text output; maps to 7verse emotion parameters
4. **SQLite** — Zero-config persistence; good enough for single-instance. Swap to PostgreSQL for multi-instance deployment
5. **Mobile-first** — CSS uses `100dvh`, safe-area-inset, touch-optimized controls

## Testing

Currently no automated tests. Planned for v0.2:
```bash
# Future
npm test                # unit tests
npm run test:e2e        # Playwright end-to-end
```

Manual testing:
```bash
# Health check
curl http://localhost:3001/api/status

# Send a test message
curl -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello","sessionId":"test"}'
```

## Deployment

### Docker
```bash
docker compose up -d
```

### Manual
- **Bridge** → any Node.js host (Railway, Fly.io, VPS)
- **Web** → Vercel (`cd src/web && vercel`)
- **Domain suggestions** → `live.7verse.ai` / `chat.7verse.ai`

## TODO / Roadmap

- [ ] 🔌 Align 7verse API paths with actual Apifox documentation
- [ ] 🎤 Browser Speech-to-Text for voice input in Mode B
- [ ] 🎬 WebRTC video streaming (currently placeholder URL)
- [ ] 📱 PWA manifest + offline support
- [ ] 🔐 Authentication layer (user sessions)
- [ ] 🧪 Unit + E2E tests
- [ ] 📦 Publish to ClawHub as reusable skill
- [ ] 🔄 TypeScript migration
- [ ] 🌐 Multi-character support in frontend
